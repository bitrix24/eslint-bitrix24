export default {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			moduleError: "Use `Dom` functions from `main.core` to manipulate an element's list of classes",
			scriptError: "Use `BX.Dom` functions from `main.core` to manipulate an element's list of classes",
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
					&& node.object.property.name === "classList"
					&& /(add|remove|item|toggle|contains)/.test(node.property.name)
				)
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
