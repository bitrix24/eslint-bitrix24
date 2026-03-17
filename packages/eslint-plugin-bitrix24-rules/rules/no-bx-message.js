module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		fixable: null,
		messages: {
			moduleError: 'Use `Loc` functions from `main.core` to get language-sensitive messages',
			scriptError: 'Use `BX.Loc` functions from `main.core` to get language-sensitive messages',
		},
	},
	create(context)
	{
		let sourceType = 'module';
		return {
			Program(node)
			{
				sourceType = node.sourceType;
			},
			MemberExpression(node)
			{
				if (
					node.object.name === 'BX'
					&& node.property.name === 'message'
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
