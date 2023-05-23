module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			error: "Don't use short class property definition",
		},
	},
	create(context) {
		return {
			PropertyDefinition(node) {
				if (node.static !== true)
				{
					context.report({
						node: node,
						messageId: "error",
					});
				}
			},
		};
	},
};