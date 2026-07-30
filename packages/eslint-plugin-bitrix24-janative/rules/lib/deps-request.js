import { REQUEST, classifyRequest } from '../../core/audit.js';
import { Extension } from '../../core/extension.js';
import { isJaNativePath } from '../../core/path-utils.js';
import { resolverForFile } from '../../core/resolver.js';

export { REQUEST, classifyRequest };

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
 * Walks every dependency request of the file — `require()` calls and, unless
 * `annotations` is off, `@deps` comments — handing each to `report` with its verdict.
 */
export function createRequestVisitor(context, report, { annotations = true } = {})
{
	const depsContext = depsContextOf(context);
	if (depsContext === null)
	{
		return {};
	}

	const visitor = {
		CallExpression(node)
		{
			const requested = requiredPathOf(node);
			if (requested !== null)
			{
				report(classifyRequest(depsContext, requested), { node, path: requested, depsContext });
			}
		},
	};

	if (annotations)
	{
		visitor['Program:exit'] = () => {
			for (const { path: requested, comment } of annotatedPaths(context))
			{
				report(classifyRequest(depsContext, requested), {
					node: comment,
					path: requested,
					depsContext,
				});
			}
		};
	}

	return visitor;
}
