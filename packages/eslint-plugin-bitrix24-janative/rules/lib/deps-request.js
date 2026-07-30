import { DEPENDENCY_TYPE, MODULE_SEPARATOR } from '../../core/constants.js';
import { Extension, findExtensionRoot } from '../../core/extension.js';
import { isJaNativePath, isNativePath, toBundleDepsPath } from '../../core/path-utils.js';
import { resolverForFile } from '../../core/resolver.js';

export const REQUEST = {
	NATIVE: 'native',
	UNRESOLVED: 'unresolved',
	EXTERNAL_BUNDLE: 'external-bundle',
	MISSING_ENTRY: 'missing-entry',
	LISTED: 'listed',
};

const ANNOTATION_PATTERN = /@deps\s+(\S+)/g;

export function filenameOf(context)
{
	return context.filename ?? context.getFilename();
}

export function sourceCodeOf(context)
{
	return context.sourceCode ?? context.getSourceCode();
}

/**
 * Everything a rule needs about the linted file, or null when the file is not part of a
 * JaNative extension and no dependency rule applies to it.
 */
export function depsContextOf(context)
{
	const filename = filenameOf(context);
	if (typeof filename !== 'string' || !isJaNativePath(filename))
	{
		return null;
	}

	const resolver = resolverForFile(filename);
	const extension = Extension.forFile(filename);

	if (resolver === null || extension === null)
	{
		return null;
	}

	return { filename, resolver, extension };
}

/**
 * Verdict on a single requested path.
 *
 * The checks form a chain — an unresolved path says nothing about deps.php — so each rule
 * reports only its own stage and the developer sees one verdict per request, not three.
 *
 * @returns {{kind: string, resolved: Object|null, depsPath: string|null}}
 */
export function classifyRequest(depsContext, requestedPath)
{
	if (isNativePath(requestedPath))
	{
		return { kind: REQUEST.NATIVE, resolved: null, depsPath: null };
	}

	const resolved = depsContext.resolver.resolve(requestedPath);
	if (resolved === null)
	{
		return { kind: REQUEST.UNRESOLVED, resolved: null, depsPath: null };
	}

	const { extension } = depsContext;

	if (resolved.type === DEPENDENCY_TYPE.BUNDLE)
	{
		if (findExtensionRoot(resolved.file) !== extension.root)
		{
			return { kind: REQUEST.EXTERNAL_BUNDLE, resolved, depsPath: null };
		}

		const depsPath = toBundleDepsPath(resolved.file, extension.root);

		return {
			kind: listsPath(extension, depsPath) ? REQUEST.LISTED : REQUEST.MISSING_ENTRY,
			resolved,
			depsPath,
		};
	}

	return {
		kind: listsPath(extension, resolved.depsPath) ? REQUEST.LISTED : REQUEST.MISSING_ENTRY,
		resolved,
		depsPath: resolved.depsPath,
	};
}

/** deps.php may spell a namespaced path with either separator; both mean the same entry. */
export function listsPath(extension, depsPath)
{
	const deps = extension.depsFile;
	if (deps.has(depsPath))
	{
		return true;
	}

	const alternative = depsPath.includes(MODULE_SEPARATOR)
		? depsPath.replace(MODULE_SEPARATOR, '/')
		: depsPath.replace('/', MODULE_SEPARATOR);

	return deps.has(alternative);
}

/** `require('path')` with a string literal, or null for anything else. */
export function requiredPathOf(node)
{
	if (node.callee?.type !== 'Identifier' || node.callee.name !== 'require')
	{
		return null;
	}

	const [argument] = node.arguments;

	return typeof argument?.value === 'string' && argument.type === 'Literal' ? argument.value : null;
}

/**
 * `@deps` annotations of the file. They exist for requests automation cannot see —
 * a template string in `require()` — and are held to the same expectations.
 *
 * @returns {Array<{path: string, comment: Object}>}
 */
export function annotatedPaths(context)
{
	const found = [];

	for (const comment of sourceCodeOf(context).getAllComments())
	{
		ANNOTATION_PATTERN.lastIndex = 0;
		let match = ANNOTATION_PATTERN.exec(comment.value);
		while (match !== null)
		{
			found.push({ path: match[1], comment });
			match = ANNOTATION_PATTERN.exec(comment.value);
		}
	}

	return found;
}

/**
 * Walks every dependency request of the file — `require()` calls and `@deps` annotations —
 * handing each to `report` together with its verdict.
 */
export function createRequestVisitor(context, report)
{
	const depsContext = depsContextOf(context);
	if (depsContext === null)
	{
		return {};
	}

	return {
		CallExpression(node)
		{
			const requested = requiredPathOf(node);
			if (requested !== null)
			{
				report(classifyRequest(depsContext, requested), { node, path: requested, depsContext });
			}
		},
		'Program:exit'()
		{
			for (const { path: requested, comment } of annotatedPaths(context))
			{
				report(classifyRequest(depsContext, requested), {
					node: comment,
					path: requested,
					depsContext,
				});
			}
		},
	};
}
