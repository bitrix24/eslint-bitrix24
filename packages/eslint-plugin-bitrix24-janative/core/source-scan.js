import { parse } from 'espree';

/**
 * `require('path')` with a string literal, in either spelling. Only used when the source
 * does not parse — a text scan cannot tell a call from the same words inside a string.
 */
export const REQUIRE_PATTERN = /(?<![.\w])(?:jn\.)?require\(\s*(['"])([^'"]+)\1\s*,?\s*\)/g;

/** `@deps path/to/extension` in a comment. */
export const DEPS_ANNOTATION_PATTERN = /@deps\s+(\S+)/g;

/** Lazy loading never goes into deps.php, but it tells that `require-lazy` is in use. */
export const LAZY_PATTERN = /(?<![.\w])requireLazy\(|(?<![.\w])jn\.import\(/;

const PARSE_OPTIONS = { ecmaVersion: 'latest', comment: true };

const WALK_SKIPPED = new Set(['type', 'loc', 'range', 'start', 'end', 'parent', 'comments', 'tokens']);

function isJnMember(node, name)
{
	return node?.type === 'MemberExpression'
		&& !node.computed
		&& node.object?.type === 'Identifier'
		&& node.object.name === 'jn'
		&& node.property?.type === 'Identifier'
		&& node.property.name === name;
}

/**
 * `require()` and `jn.require()` are one call seen from two scopes: the argument handed out
 * by `jn.define()`, and the global form used by the code living outside a define.
 */
export function isRequireCallee(callee)
{
	return (callee?.type === 'Identifier' && callee.name === 'require') || isJnMember(callee, 'require');
}

function isLazyCallee(callee)
{
	return (callee?.type === 'Identifier' && callee.name === 'requireLazy') || isJnMember(callee, 'import');
}

export function stringArgumentOf(node)
{
	const [argument] = node.arguments;

	return argument?.type === 'Literal' && typeof argument.value === 'string' ? argument.value : null;
}

function* nodesOf(value)
{
	if (Array.isArray(value))
	{
		for (const item of value)
		{
			yield* nodesOf(item);
		}

		return;
	}

	if (value === null || typeof value !== 'object' || typeof value.type !== 'string')
	{
		return;
	}

	yield value;

	for (const [key, child] of Object.entries(value))
	{
		if (!WALK_SKIPPED.has(key))
		{
			yield* nodesOf(child);
		}
	}
}

function parseSource(source)
{
	for (const sourceType of ['script', 'module'])
	{
		try
		{
			return parse(source, { ...PARSE_OPTIONS, sourceType });
		}
		catch
		{
			// The other form may still parse: a test written with import/export, for one.
		}
	}

	return null;
}

function collectAnnotations(text, paths)
{
	for (const match of text.matchAll(DEPS_ANNOTATION_PATTERN))
	{
		paths.add(match[1]);
	}
}

function scanParsed(ast)
{
	const paths = new Set();
	let usesLazyLoading = false;

	for (const node of nodesOf(ast))
	{
		if (node.type !== 'CallExpression')
		{
			continue;
		}

		if (isLazyCallee(node.callee))
		{
			usesLazyLoading = true;
			continue;
		}

		if (!isRequireCallee(node.callee))
		{
			continue;
		}

		const requested = stringArgumentOf(node);
		if (requested !== null)
		{
			paths.add(requested);
		}
	}

	for (const comment of ast.comments ?? [])
	{
		collectAnnotations(comment.value, paths);
	}

	return { paths, usesLazyLoading };
}

function scanText(source)
{
	const paths = new Set();

	for (const match of source.matchAll(REQUIRE_PATTERN))
	{
		paths.add(match[2]);
	}

	collectAnnotations(source, paths);

	return { paths, usesLazyLoading: LAZY_PATTERN.test(source) };
}

/**
 * Dependency requests of a source, and whether it loads anything lazily.
 *
 * Reading the code is the only dependable way: a text scan breaks on every spelling it was
 * not written for — a require split across lines with a trailing comma, for one — and takes
 * the same words inside a template string for a call.
 *
 * @returns {{paths: Set<string>, usesLazyLoading: boolean}}
 */
export function scanSource(source)
{
	const ast = parseSource(source);

	return ast === null ? scanText(source) : scanParsed(ast);
}
