module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Prevent the use of global `jn.require` when `require` argument is present',
			recommended: true,
		},
		schema: [],
		fixable: 'code',
	},

	create(context)
	{
		function checkRequireUsage(node)
		{
			const scope = context.getScope();

			const requireArg = scope.variables.find(variable => {
				return variable.name === 'require';
			});

			if (requireArg)
			{
				context.report({
					node,
					message: 'Do not use `jn.require` when `require` argument is present',
					fix: fixer => fixer.replaceText(node.callee, 'require'),
				});
			}
		}

		return {
			CallExpression(node)
			{
				if (node.callee.type === 'MemberExpression' && node.callee.object.name === 'jn' && node.callee.property.name === 'require')
				{
					checkRequireUsage(node);
				}
			},
		};
	},
};
