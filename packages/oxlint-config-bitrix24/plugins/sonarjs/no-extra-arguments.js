// Disallows passing a function more arguments than it declares parameters.
//
// Checks calls of functions declared once in the file (`function f() {}`, `const f = () => {}`)
// and immediately invoked function expressions. A function with a rest parameter, one that
// reads `arguments`, and an empty function without parameters accept any arguments.

import { calledFunction, isFunction } from './helpers.js';

function pluralize(count, one, many)
{
	return count === 1 ? `1 ${one}` : `${count} ${many}`;
}

export default {
	meta: {
		type: 'problem',
		docs: { description: 'Function calls should not pass extra arguments' },
		schema: [],
		messages: {
			tooManyArguments: 'This function expects {{expected}}, but {{provided}} provided.',
		},
	},
	create(context)
	{
		const sourceCode = context.sourceCode;
		const calls = [];
		const readingArguments = new Set();

		return {
			CallExpression(node)
			{
				const callee = node.callee;
				const fn = callee.type === 'FunctionExpression' || callee.type === 'ArrowFunctionExpression'
					? callee
					: calledFunction(node, sourceCode);
				if (!fn || fn.params.some((param) => param.type === 'RestElement'))
				{
					return;
				}

				if (node.arguments.length > fn.params.length)
				{
					calls.push({ call: node, fn });
				}
			},

			Identifier(node)
			{
				if (node.name !== 'arguments')
				{
					return;
				}

				const reference = sourceCode.getScope(node).references.find((candidate) => candidate.identifier === node);
				if (reference?.resolved && reference.resolved.defs.length > 0)
				{
					return;
				}

				// arrow functions have no `arguments` of their own
				for (let current = node.parent; current; current = current.parent)
				{
					if (isFunction(current) && current.type !== 'ArrowFunctionExpression')
					{
						readingArguments.add(current);

						return;
					}
				}
			},

			'Program:exit'()
			{
				for (const { call, fn } of calls)
				{
					const isEmpty = fn.body?.type === 'BlockStatement' && fn.body.body.length === 0 && fn.params.length === 0;
					if (readingArguments.has(fn) || isEmpty)
					{
						continue;
					}

					const expected = fn.params.length;
					const provided = call.arguments.length;
					context.report({
						node: call.callee,
						messageId: 'tooManyArguments',
						data: {
							expected: expected === 0 ? 'no arguments' : pluralize(expected, 'argument', 'arguments'),
							provided: pluralize(provided, 'was', 'were'),
						},
					});
				}
			},
		};
	},
};
