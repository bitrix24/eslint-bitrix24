module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			nullError: "Use Type.isNull() from `main.core` to compare an operand with null",
			undefinedError: "Use Type.isNull() from `main.core` to compare an operand with undefined",
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
