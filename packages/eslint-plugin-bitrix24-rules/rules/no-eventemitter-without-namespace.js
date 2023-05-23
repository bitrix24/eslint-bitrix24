module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			error: "The instance of EventEmitter is supposed to have an event namespace. Use this.setEventNamespace() to make events more unique.",
		},
	},
	create(context) {
		return {
			"ClassDeclaration[superClass.property.name=\"EventEmitter\"] MethodDefinition[kind=\"constructor\"]:not(:has(CallExpression[callee.property.name=\"setEventNamespace\"])), ClassDeclaration[superClass.name=\"EventEmitter\"] MethodDefinition[kind=\"constructor\"]:not(:has(CallExpression[callee.property.name=\"setEventNamespace\"]))": (node) => {
				context.report({
					node: node,
					messageId: "error",
				});
			},
		};
	},
};