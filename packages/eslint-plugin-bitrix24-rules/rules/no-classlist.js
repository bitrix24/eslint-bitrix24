module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			moduleError: "Use `Dom` functions from `main.core` for works with element classes \ndocs and examples: http://docs.bx/R&D/bitrix_dev/javascript-dev/core_library#dom",
			scriptError: "Use `BX.Dom` functions from `main.core` for works with element classes \ndocs and examples: http://docs.bx/R&D/bitrix_dev/javascript-dev/core_library#dom",
		},
	},
	create(context) {
		let sourceType = "module";
		return {
			Program(node) {
				sourceType = node.sourceType;
			},
			MemberExpression(node) {
				if (
					node.object.property
					&& node.object.property.name === "classList"
					&& /(add|remove|item|toggle|contains)/.test(node.property.name)
				)
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