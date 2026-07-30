import { parse } from 'espree';

/**
 * `require('path')` with a string literal, in either spelling. Only used when the source
 * does not parse — a text scan cannot tell a call from the same words inside a string.
 */
const REQUIRE_PATTERN = /(?<![.\w])(?:jn\.)?require\(\s*(['"])([^'"]+)\1\s*,?\s*\)/g;

/** `@deps path/to/extension` in a comment. */
export const DEPS_ANNOTATION_PATTERN = /@deps\s+(\S+)/g;

/** Lazy loading never goes into deps.php, but it tells that `require-lazy` is in use. */
const LAZY_PATTERN = /(?<![.\w])requireLazy\(|(?<![.\w])jn\.import\(/;

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

/**
 * Explicit stack, no generators: the walk visits every property of every node, and on a
 * repository-sized run the generator machinery costs more than the parse itself did.
 */
function eachNode(root, visit)
{
	const stack = [root];

	while (stack.length > 0)
	{
		const value = stack.pop();

		if (Array.isArray(value))
		{
			for (let i = value.length - 1; i >= 0; i--)
			{
				stack.push(value[i]);
			}
			continue;
		}

		if (value === null || typeof value !== 'object' || typeof value.type !== 'string')
		{
			continue;
		}

		visit(value);

		for (const key in value)
		{
			if (!WALK_SKIPPED.has(key))
			{
				stack.push(value[key]);
			}
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

/** Scan of an already parsed tree — the AST ESLint hands to a rule works here as is. */
export function scanParsed(ast)
{
	const paths = new Set();
	let usesLazyLoading = false;

	eachNode(ast, (node) => {
		if (node.type !== 'CallExpression')
		{
			return;
		}

		if (isLazyCallee(node.callee))
		{
			usesLazyLoading = true;
			return;
		}

		if (isRequireCallee(node.callee))
		{
			const requested = stringArgumentOf(node);
			if (requested !== null)
			{
				paths.add(requested);
			}
		}
	});

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

	// The whole text, strings included: without a parse there is no telling a comment from
	// a string literal, and missing a real annotation costs more than reading a fake one.
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
