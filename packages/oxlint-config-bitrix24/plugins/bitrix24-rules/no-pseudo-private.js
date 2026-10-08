// Class members named `_like` this, and `this._like = ...`: pseudo-private members that
// should be `#private`. Local variables (`const _this = this`), module functions and
// properties of other objects are not members of the class and are not reported.
const MEMBER_TYPES = new Set(['PropertyDefinition', 'MethodDefinition', 'ClassProperty', 'ClassMethod', 'TSAbstractPropertyDefinition', 'TSAbstractMethodDefinition']);

export function create(context)
{
	const report = (node) => context.report({ node, messageId: 'error' });

	const isPseudoPrivate = (key) => key?.type === 'Identifier' && key.name.startsWith('_');

	return {
		ClassBody(node)
		{
			for (const member of node.body)
			{
				if (MEMBER_TYPES.has(member.type) && !member.computed && isPseudoPrivate(member.key))
				{
					report(member.key);
				}
			}
		},
		AssignmentExpression(node)
		{
			const left = node.left;
			if (left.type === 'MemberExpression' && !left.computed && left.object.type === 'ThisExpression' && isPseudoPrivate(left.property))
			{
				report(left.property);
			}
		},
	};
}
