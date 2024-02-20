module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow static properties in classes (>= iOS 14.5)',
			recommended: true,
		},
		schema: [],
	},

	create(context)
	{
		function checkForStaticProperties(node)
		{
			if (node.static && node.type === 'PropertyDefinition')
			{
				context.report({
					node,
					message: 'Static properties are not allowed in classes, only static functions are allowed',
				});
			}
		}

		return {
			ClassDeclaration(node)
			{
				node.body.body.forEach(checkForStaticProperties);
			},

			ClassExpression(node)
			{
				node.body.body.forEach(checkForStaticProperties);
			},
		};
	},
};
