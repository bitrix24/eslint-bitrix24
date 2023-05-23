module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			error: "Don't use pseudo private properties",
		},
	},
	create(context) {
		return {
			VariableDeclarator(node) {
				if (node?.id?.name?.startsWith("_"))
				{
					context.report({
						node: node,
						messageId: "error",
					});
				}
			},
			PropertyDefinition(node) {
				if (node?.key?.name?.startsWith("_"))
				{
					context.report({
						node: node.key,
						messageId: "error",
					});
				}
			},
			MethodDefinition(node) {
				if (node?.key?.name?.startsWith("_"))
				{
					context.report({
						node: node.key,
						messageId: "error",
					});
				}
			},
			LabeledStatement(node) {
				if (node?.label?.name?.startsWith("_"))
				{
					context.report({
						node: node,
						messageId: "error",
					});
				}
			},
			FunctionDeclaration(node) {
				if (node?.id?.name?.startsWith("_"))
				{
					context.report({
						node: node.id,
						messageId: "error",
					});
				}
			},
			ClassDeclaration(node) {
				if (node?.id?.name?.startsWith("_"))
				{
					context.report({
						node: node.id,
						messageId: "error",
					});
				}
			},
			AssignmentExpression(node) {
				if (node?.left?.property?.name?.startsWith("_"))
				{
					context.report({
						node: node.left.property,
						messageId: "error",
					});
				}
			},
		};
	},
};