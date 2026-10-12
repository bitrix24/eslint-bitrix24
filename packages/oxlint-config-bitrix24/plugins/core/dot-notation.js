// Requires dot notation for computed member access with a static identifier-like key:
// `obj['name']` -> `obj.name`. Autofixable.
//
// Options (subset of ESLint's dot-notation): `allowKeywords` (default true) allows
// reserved words after the dot; with `false` such keys must stay in brackets.

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/u;
const KEYWORDS = new Set([
	'abstract', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue',
	'debugger', 'default', 'delete', 'do', 'double', 'else', 'enum', 'export', 'extends', 'false',
	'final', 'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import', 'in',
	'instanceof', 'int', 'interface', 'long', 'native', 'new', 'null', 'package', 'private',
	'protected', 'public', 'return', 'short', 'static', 'super', 'switch', 'synchronized', 'this',
	'throw', 'throws', 'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while', 'with',
]);

function staticKey(property)
{
	if (property.type === 'Literal' && typeof property.value === 'string')
	{
		return property.value;
	}

	if (property.type === 'TemplateLiteral' && property.expressions.length === 0 && property.quasis.length === 1)
	{
		return property.quasis[0].value.cooked;
	}

	return null;
}

export default {
	meta: {
		type: 'suggestion',
		docs: { description: 'Enforce dot notation whenever possible' },
		fixable: 'code',
		schema: [
			{
				type: 'object',
				properties: {
					allowKeywords: { type: 'boolean' },
				},
				additionalProperties: false,
			},
		],
		messages: {
			useDot: '[{{key}}] is better written in dot notation.',
		},
	},
	create(context)
	{
		const allowKeywords = context.options[0]?.allowKeywords ?? true;
		const sourceCode = context.sourceCode;

		return {
			MemberExpression(node)
			{
				if (!node.computed)
				{
					return;
				}

				const key = staticKey(node.property);
				if (key === null || !IDENTIFIER.test(key) || (!allowKeywords && KEYWORDS.has(key)))
				{
					return;
				}

				context.report({
					node: node.property,
					messageId: 'useDot',
					data: { key: sourceCode.getText(node.property) },
					fix(fixer)
					{
						const openBracket = sourceCode.getTokenBefore(node.property, (token) => token.value === '[');
						const closeBracket = sourceCode.getTokenAfter(node.property);
						if (!openBracket || !closeBracket || closeBracket.value !== ']')
						{
							return null;
						}

						if (sourceCode.commentsExistBetween(openBracket, closeBracket))
						{
							return null;
						}

						// `1['toString']` would become `1.toString`, which is a syntax error
						const object = node.object;
						if (object.type === 'Literal' && typeof object.value === 'number' && /^\d+$/u.test(sourceCode.getText(object)))
						{
							return null;
						}

						const tokenBeforeBracket = sourceCode.getTokenBefore(openBracket);
						const dot = tokenBeforeBracket && tokenBeforeBracket.value === '?.' ? '' : '.';

						return fixer.replaceTextRange([openBracket.range[0], closeBracket.range[1]], `${dot}${key}`);
					},
				});
			},
		};
	},
};
