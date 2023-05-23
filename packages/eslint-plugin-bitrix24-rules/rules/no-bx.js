module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			error: "Use function from `main.core`",
		},
	},
	create(context) {
		return {
			"CallExpression[callee.object.name=\"BX\"]": (node) => {
				context.report({
					node,
					messageId: "error",
				});
			},
		};
	},
};