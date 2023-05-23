module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			moduleError: "Use `Event` functions from `main.core` for works with DOM events. Docs and examples: http://docs.bx/R&D/bitrix_dev/javascript-dev/core_library#event",
			scriptError: "Use `BX.Event` functions from `main.core` for works with DOM events. Docs and examples: http://docs.bx/R&D/bitrix_dev/javascript-dev/core_library#event",
		},
	},
	create(context) {
		let sourceType = "module";
		return {
			Program(node) {
				sourceType = node.sourceType;
			},
			MemberExpression(node) {
				if (/^(add|remove)EventListener$/.test(node.property.name))
				{
					context.report({
						node: node.property,
						messageId: `${sourceType}Error`,
					});
				}
			},
		};
	},
};