module.exports = {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			moduleError: "Use `Draggable` from `ui.draganddrop.draggable` to create awesome DnD interface",
			scriptError: "Use `BX.UI.DragAndDrop.Draggable` from `ui.draganddrop.draggable` to create awesome DnD interface",
		},
	},
	create(context) {
		let sourceType = "module";
		return {
			Program(node) {
				sourceType = node.sourceType;
			},
			Identifier(node) {
				if (node.name === "jsDD")
				{
					context.report({
						node: node,
						messageId: `${sourceType}Error`,
					});
				}
			},
		};
	},
};