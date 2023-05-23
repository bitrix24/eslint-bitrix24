module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			moduleError: "Use `Dom.style` from `main.core` for works with element styles \ndocs and examples: http://docs.bx/R&D/bitrix_dev/javascript-dev/core_library#dom-style",
			scriptError: "Use `BX.Dom.style` from `main.core` for works with element styles \ndocs and examples: http://docs.bx/R&D/bitrix_dev/javascript-dev/core_library#dom-style",
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
					&& node.object.property.name === "style"
					&& node.property.name
				)
				{
					context.report({
						node: node.object.property,
						messageId: `${sourceType}Error`,
					});
				}
			},
		};
	},
};