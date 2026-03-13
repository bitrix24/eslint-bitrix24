module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			moduleError: "Use `Event.bind` and `Event.unbind` from `main.core` to add and remove DOM events respectively",
			scriptError: "Use `Event.bind` and `Event.unbind` from `main.core` to add and remove DOM events respectively",
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
