module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			error: "Polyfill required! Add `import 'main.polyfill.intersectionobserver';`",
		},
	},
	create(context) {
		let hasPolyfillImport = false;
		return {
			ImportDeclaration: (node) => {
				if (node.source.value === "main.polyfill.intersectionobserver")
				{
					hasPolyfillImport = true;
				}
			},
			NewExpression: (node) => {
				if (
					node.callee.name === "IntersectionObserver"
					&& !hasPolyfillImport
				)
				{
					context.report({
						node: node.callee,
						messageId: "error",
					});
				}
			},
		};
	},
};