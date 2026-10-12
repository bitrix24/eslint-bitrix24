// The browser's `alert()` and `confirm()`: called as globals or on `window`, `top`, `parent`.
// Names are matched exactly; `confirmBox()`, `onConfirm()` and a local `alert` are not reported.
const DIALOGS = new Set(['alert', 'confirm']);
const WINDOWS = new Set(['window', 'top', 'parent']);

function isGlobal(context, identifier)
{
	for (let scope = context.sourceCode.getScope(identifier); scope; scope = scope.upper)
	{
		const variable = scope.set?.get(identifier.name);
		if (variable)
		{
			return variable.defs.length === 0;
		}
	}

	return true;
}

export function create(context)
{
	const report = (node) => context.report({ node, messageId: `${context.sourceCode.ast.sourceType}Error` });

	return {
		CallExpression(node)
		{
			if (node.callee.type === 'Identifier' && DIALOGS.has(node.callee.name) && isGlobal(context, node.callee))
			{
				report(node);
			}
		},
		MemberExpression(node)
		{
			if (
				!node.computed
				&& node.object.type === 'Identifier'
				&& WINDOWS.has(node.object.name)
				&& DIALOGS.has(node.property.name)
				&& isGlobal(context, node.object)
			)
			{
				report(node.property);
			}
		},
	};
}
