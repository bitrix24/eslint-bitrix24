// `BX.*()` calls. `BX.message()` is left to no-bx-message, which reports it with the
// replacement, instead of reporting it twice.
export function create(context)
{
	return {
		CallExpression(node)
		{
			const callee = node.callee;
			if (callee.type !== 'MemberExpression' || callee.object.type !== 'Identifier' || callee.object.name !== 'BX')
			{
				return;
			}

			if (!callee.computed && callee.property.name === 'message')
			{
				return;
			}

			context.report({ node, messageId: 'error' });
		},
	};
}
