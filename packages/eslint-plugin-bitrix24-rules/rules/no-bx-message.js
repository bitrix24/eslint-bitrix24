module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			moduleError: "Use `Loc` functions from `main.core` for works with messages \ndocs and examples: http://docs.bx/R&D/bitrix_dev/javascript-dev/core_library#loc",
			scriptError: "Use `BX.Loc` functions from `main.core` for works with messages \ndocs and examples: http://docs.bx/R&D/bitrix_dev/javascript-dev/core_library#loc",
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
					node.object.name === "BX"
					&& node.property.name === "message"
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