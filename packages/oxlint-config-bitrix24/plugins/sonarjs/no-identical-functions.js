// Disallows functions with identical implementations in one file.
//
// Checks function declarations, methods, and function and arrow function expressions assigned
// to variables, whose bodies span at least the given number of lines. Bodies are compared
// token by token, so formatting and comments do not matter.
//
// Options: the minimal number of lines of a body (default 3, at least 3).

import { areEquivalent, functionLocation } from './helpers.js';

const DEFAULT_MIN_LINES = 3;

function isChecked(node)
{
	if (node.type === 'FunctionDeclaration')
	{
		return true;
	}

	return node.parent?.type === 'VariableDeclarator' || node.parent?.type === 'MethodDefinition';
}

export default {
	meta: {
		type: 'problem',
		docs: { description: 'Functions should not have identical implementations' },
		schema: [{ type: 'integer', minimum: 3 }],
		messages: {
			identicalFunctions: 'Update this function so that its implementation is not identical to the one on line {{line}}.',
		},
	},
	create(context)
	{
		const minLines = context.options[0] ?? DEFAULT_MIN_LINES;
		const sourceCode = context.sourceCode;
		const functions = [];

		const lineCount = (body) => {
			const tokens = sourceCode.getTokens(body);
			if (tokens[0]?.value === '{')
			{
				tokens.shift();
			}

			if (tokens.at(-1)?.value === '}')
			{
				tokens.pop();
			}

			return tokens.length === 0 ? 0 : tokens.at(-1).loc.end.line - tokens[0].loc.start.line + 1;
		};

		const collect = (node) => {
			if (isChecked(node) && lineCount(node.body) >= minLines)
			{
				functions.push(node);
			}
		};

		return {
			FunctionDeclaration: collect,
			FunctionExpression: collect,
			ArrowFunctionExpression: collect,
			'Program:exit'()
			{
				for (const [index, duplicate] of functions.entries())
				{
					const original = functions.slice(0, index).find((candidate) => areEquivalent(candidate.body, duplicate.body, sourceCode));
					if (original)
					{
						context.report({
							loc: functionLocation(duplicate, sourceCode),
							messageId: 'identicalFunctions',
							data: { line: String(original.loc.start.line) },
						});
					}
				}
			},
		};
	},
};
