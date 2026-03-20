export default {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			moduleError: "Use `Dom.style` from `main.core` to change element styles",
			scriptError: "Use `BX.Dom.style` from `main.core` to change element styles",
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
