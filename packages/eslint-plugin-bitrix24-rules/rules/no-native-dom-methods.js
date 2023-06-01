module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			moduleError: "Use `Dom` functions from `main.core` to manipulate element's children. \ndocs and examples: http://docs.bx/R&D/bitrix_dev/javascript-dev/core_library#dom",
			scriptError: "Use `BX.Dom` functions from `main.core` to manipulate element's children. \ndocs and examples: http://docs.bx/R&D/bitrix_dev/javascript-dev/core_library#dom",
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
					node?.callee?.object?.name !== "Dom"
					&& node?.callee?.property
					&& /(append|replace|remove)Child|insertBefore/.test(node.callee.property.name)
				)
				{
					context.report({
						node: node.callee.property,
						messageId: `${sourceType}Error`,
					});
				}
			},
		};
	},
};
