// Helpers shared by the rules of @bitrix24/sonarjs.

export const isFunction = (node) => node?.type === 'FunctionDeclaration'
	|| node?.type === 'FunctionExpression'
	|| node?.type === 'ArrowFunctionExpression';

/**
 * Where a report about a function points: its name for a declaration or a method,
 * the `function` keyword for an anonymous function, `=>` for an arrow function.
 */
export function functionLocation(node, sourceCode)
{
	const parent = node.parent;
	if (node.type === 'FunctionDeclaration' && node.id)
	{
		return node.id.loc;
	}

	if (node.type === 'FunctionExpression' && (parent?.type === 'MethodDefinition' || parent?.type === 'Property') && parent.value === node)
	{
		return parent.key.loc;
	}

	if (node.type === 'ArrowFunctionExpression')
	{
		const arrow = sourceCode.getTokenBefore(node.body, (token) => token.value === '=>');

		return arrow?.loc ?? node.loc;
	}

	const keyword = sourceCode.getFirstToken(node, (token) => token.value === 'function');

	return keyword?.loc ?? node.loc;
}

function sameTokens(first, second, sourceCode)
{
	const firstTokens = sourceCode.getTokens(first);
	const secondTokens = sourceCode.getTokens(second);

	return firstTokens.length === secondTokens.length
		&& firstTokens.every((token, index) => token.value === secondTokens[index].value);
}

/**
 * Two nodes (or two lists of nodes) are equivalent when they are of the same type
 * and consist of the same tokens: formatting and comments do not matter.
 */
export function areEquivalent(first, second, sourceCode)
{
	if (Array.isArray(first) || Array.isArray(second))
	{
		return Array.isArray(first)
			&& Array.isArray(second)
			&& first.length === second.length
			&& first.every((node, index) => areEquivalent(node, second[index], sourceCode));
	}

	return first.type === second.type && sameTokens(first, second, sourceCode);
}

/**
 * The function a call expression calls when the callee is the name of a function
 * declared once in the file: `function f() {}` or `const f = () => {}`.
 */
export function calledFunction(call, sourceCode)
{
	const callee = call.callee;
	if (callee.type !== 'Identifier')
	{
		return null;
	}

	const reference = sourceCode.getScope(call).references.find((candidate) => candidate.identifier === callee);
	const variable = reference?.resolved;
	if (!variable || variable.defs.length !== 1)
	{
		return null;
	}

	const definition = variable.defs[0];
	if (definition.type === 'FunctionName')
	{
		return definition.node;
	}

	if (definition.type === 'Variable')
	{
		const init = definition.node.init;

		return init?.type === 'FunctionExpression' || init?.type === 'ArrowFunctionExpression' ? init : null;
	}

	return null;
}
