// Disallows using the result of a function that never returns a value.
//
// Checks calls of functions declared once in the file (`function f() {}`, `const f = () => {}`)
// whose result is used: assigned, passed on, compared and so on. A call used as a statement,
// returned, thrown, awaited, under a unary operator, or as the body of an arrow function
// is not a use. Async functions, generators and empty functions count as returning a value,
// and so does a TypeScript `declare function` with a return type other than void, never
// or undefined.

import { calledFunction, isFunction } from './helpers.js';

const EMPTY_RETURN_TYPES = new Set(['TSVoidKeyword', 'TSNeverKeyword', 'TSUndefinedKeyword']);

function isResultUsed(call)
{
	const parent = call.parent;
	switch (parent.type)
	{
		case 'LogicalExpression':
			return parent.left === call;
		case 'SequenceExpression':
			return parent.expressions.at(-1) === call;
		case 'ConditionalExpression':
			return parent.test === call;
		case 'ExpressionStatement':
		case 'ArrowFunctionExpression':
		case 'UnaryExpression':
		case 'AwaitExpression':
		case 'ReturnStatement':
		case 'ThrowStatement':
			return false;
		default:
			return true;
	}
}

export default {
	meta: {
		type: 'problem',
		docs: { description: "The output of functions that don't return anything should not be used" },
		schema: [],
		messages: {
			removeUseOfOutput: 'Remove this use of the output from "{{name}}"; "{{name}}" doesn\'t return anything.',
		},
	},
	create(context)
	{
		const sourceCode = context.sourceCode;
		const calls = [];
		const returningValue = new Set();

		const collect = (node) => {
			const isEmpty = node.body.type === 'BlockStatement' && node.body.body.length === 0;
			if (node.async || node.generator || isEmpty || node.body.type !== 'BlockStatement')
			{
				returningValue.add(node);
			}
		};

		return {
			FunctionDeclaration: collect,
			FunctionExpression: collect,
			ArrowFunctionExpression: collect,

			TSDeclareFunction(node)
			{
				const returnType = node.returnType?.typeAnnotation.type;
				if (returnType && !EMPTY_RETURN_TYPES.has(returnType))
				{
					returningValue.add(node);
				}
			},

			CallExpression(node)
			{
				if (!isResultUsed(node))
				{
					return;
				}

				const fn = calledFunction(node, sourceCode);
				if (fn)
				{
					calls.push({ callee: node.callee, fn });
				}
			},

			ReturnStatement(node)
			{
				if (!node.argument)
				{
					return;
				}

				for (let current = node.parent; current; current = current.parent)
				{
					if (isFunction(current))
					{
						returningValue.add(current);

						return;
					}
				}
			},

			'Program:exit'()
			{
				for (const { callee, fn } of calls)
				{
					if (!returningValue.has(fn))
					{
						context.report({
							node: callee,
							messageId: 'removeUseOfOutput',
							data: { name: callee.name },
						});
					}
				}
			},
		};
	},
};
