// `typeof` checks that `Type` from `main.core` replaces. Not reported:
// - `typeof SomeGlobal`, an identifier the file does not declare: `typeof ResizeObserver !==
//   'undefined'` is the only check of a global that may be missing, `Type.isUndefined()`
//   would throw a ReferenceError;
// - `typeof x` used as a value (`return typeof x`, a message), which no `Type` function gives.
const COMPARISONS = new Set(['===', '!==', '==', '!=']);

function isDeclared(context, identifier)
{
	for (let scope = context.sourceCode.getScope(identifier); scope; scope = scope.upper)
	{
		const variable = scope.set?.get(identifier.name);
		if (variable)
		{
			return variable.defs.length > 0;
		}
	}

	return false;
}

export function create(context)
{
	return {
		UnaryExpression(node)
		{
			if (node.operator !== 'typeof')
			{
				return;
			}

			if (node.argument.type === 'Identifier' && !isDeclared(context, node.argument))
			{
				return;
			}

			const parent = node.parent;
			const checked = (parent.type === 'BinaryExpression' && COMPARISONS.has(parent.operator))
				|| (parent.type === 'SwitchStatement' && parent.discriminant === node);
			if (!checked)
			{
				return;
			}

			context.report({ node, messageId: `${context.sourceCode.ast.sourceType}Error` });
		},
	};
}
