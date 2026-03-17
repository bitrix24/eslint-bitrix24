module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			moduleError: "Use `MessageBox` from `ui.dialogs.messagebox` to create user friendly dialogs",
			scriptError: "Use `BX.UI.Dialogs.MessageBox` from `ui.dialogs.messagebox` to create user friendly dialogs",
		},
	},
	create(context) {
		let sourceType = "module";
		return {
			Program(node) {
				sourceType = node.sourceType;
			},
			CallExpression(node) {
				if (
					/(alert|confirm)/.test(node.callee.name)
				)
				{
					context.report({
						node: node,
						messageId: `${sourceType}Error`,
					});
				}
			},
			MemberExpression(node)
			{
				if (
					/(window|top|parent)/.test(node.object.name)
					&& /(alert|confirm)/.test(node.property.name)
				)
				{
					context.report({
						node: node.property,
						messageId: `${sourceType}Error`,
					});
				}
			}
		};
	},
};