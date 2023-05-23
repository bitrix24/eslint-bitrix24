module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			moduleError: "Use `Type` functions from `main.core` for type checking \ndocs and examples: http://docs.bx/R&D/bitrix_dev/javascript-dev/core_library#type",
			scriptError: "Use `BX.Type` functions from `main.core` for type checking \ndocs and examples: http://docs.bx/R&D/bitrix_dev/javascript-dev/core_library#type",
		},
	},
	create(context) {
		let sourceType = "module";
		return {
			Program(node) {
				sourceType = node.sourceType;
			},
			UnaryExpression(node) {
				if (node.operator === "typeof")
				{
					context.report({
						node,
						messageId: `${sourceType}Error`,
					});
				}
			},
		};
	},
};