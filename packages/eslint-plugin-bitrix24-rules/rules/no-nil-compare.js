module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			nullError: "Use Type.isNull() from `main.core` for compare with null",
			undefinedError: "Use Type.isUndefined() from `main.core` for compare with undefined",
		},
	},
	create(context) {
		return {
			BinaryExpression(node) {
				if (node.operator)
				{
					if (
						node?.left?.raw === "null"
						|| node?.right?.raw === "null"
					)
					{
						context.report({
							node: node,
							messageId: "nullError",
						});
					}

					if (
						node?.left?.name === "undefined"
						|| node?.right?.name === "undefined"
					)
					{
						context.report({
							node: node,
							messageId: "undefinedError",
						});
					}
				}
			},
		};
	},
};