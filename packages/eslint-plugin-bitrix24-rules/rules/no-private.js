module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			error: "Don't use private class properties",
		},
	},
	create(context) {
		return {
			PrivateIdentifier(node) {
				context.report({
					node: node,
					messageId: "error",
				});
			},
		};
	},
};