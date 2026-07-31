import { REQUEST, classifyRequest } from '../../core/audit.js';
import { Extension } from '../../core/extension.js';
import { isJaNativePath } from '../../core/path-utils.js';
import { resolverForFile } from '../../core/resolver.js';
import { DEPS_ANNOTATION_PATTERN, isRequireCallee, stringArgumentOf } from '../../core/source-scan.js';

export { REQUEST, classifyRequest };

function filenameOf(context)
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

/** `require('path')` or `jn.require('path')` with a string literal, or null for anything else. */
function requiredPathOf(node)
{
	return isRequireCallee(node.callee) ? stringArgumentOf(node) : null;
}

/**
 * `@deps` annotations of the file. They exist for requests automation cannot see
 * (a template string in `require()`) and are held to the same expectations.
 *
 * @returns {Array<{path: string, comment: Object}>}
 */
function annotatedPaths(context)
{
	const found = [];

	for (const comment of sourceCodeOf(context).getAllComments())
	{
		for (const match of comment.value.matchAll(DEPS_ANNOTATION_PATTERN))
		{
			found.push({ path: match[1], comment });
		}
	}

	return found;
}

/**
 * Walks every dependency request of the file (`require()` calls and, unless
 * `annotations` is off, `@deps` comments), handing each to `report` with its verdict.
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
				report(classifyRequest(depsContext, requested), { node, path: requested });
			}
		},
	};

	if (annotations)
	{
		visitor['Program:exit'] = () => {
			for (const { path: requested, comment } of annotatedPaths(context))
			{
				report(classifyRequest(depsContext, requested), { node: comment, path: requested });
			}
		};
	}

	return visitor;
}

/**
 * The three rules that flag one verdict kind with one message are the same rule up to four
 * values; this builds them.
 */
export function createKindRule({ kind, description, messageId, message, data = () => ({}) })
{
	return {
		meta: {
			type: 'problem',
			docs: { description, recommended: true },
			schema: [],
			messages: { [messageId]: message },
		},

		create(context)
		{
			return createRequestVisitor(context, (verdict, { node, path }) => {
				if (verdict.kind === kind)
				{
					context.report({ node, messageId, data: { path, ...data(verdict, path) } });
				}
			});
		},
	};
}
