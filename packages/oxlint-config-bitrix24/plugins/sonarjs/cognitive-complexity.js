// Limits the Cognitive Complexity of a function: how hard its control flow is to follow.
//
// A function gets
// - +1 for every `if`, `else if`, `else`, loop, `switch`, `catch`, `?:`, labeled `break`/`continue`
//   and every sequence of the same logical operator (`a && b && c` is +1, `a && b || c` is +2);
// - an extra +1 per nesting level for `if`, loops, `switch`, `catch` and `?:` nested in
//   other such structures.
// `a || {}` and `a ?? []` as a default value add nothing. Nested functions are measured on
// their own and add nothing to the function they are in.
//
// Options: the highest allowed complexity (default 15).

import { functionLocation, isFunction } from './helpers.js';

const DEFAULT_THRESHOLD = 15;
const SKIPPED_KEYS = new Set(['parent', 'loc', 'range', 'start', 'end', 'type']);
const DEFAULT_VALUE_LITERALS = new Set(['Literal', 'ArrayExpression', 'ObjectExpression']);

function children(node, visitorKeys)
{
	const keys = visitorKeys[node.type] ?? Object.keys(node).filter((key) => !SKIPPED_KEYS.has(key));

	return keys.flatMap((key) => {
		const value = node[key];
		if (Array.isArray(value))
		{
			return value.filter((child) => typeof child?.type === 'string');
		}

		return typeof value?.type === 'string' ? [value] : [];
	});
}

// `const x = a || literal` and `x = x || literal`
function isDefaultValue(node, sourceCode)
{
	if ((node.operator !== '||' && node.operator !== '??') || !DEFAULT_VALUE_LITERALS.has(node.right.type))
	{
		return false;
	}

	const parent = node.parent;
	if (parent.type === 'VariableDeclarator')
	{
		return true;
	}

	return parent.type === 'AssignmentExpression' && sourceCode.getText(parent.left) === sourceCode.getText(node.left);
}

// operators of a chain of logical expressions in source order, and its operands
function flattenLogical(node, operators, operands)
{
	if (node.type !== 'LogicalExpression')
	{
		operands.push(node);

		return;
	}

	flattenLogical(node.left, operators, operands);
	operators.push(node.operator);
	flattenLogical(node.right, operators, operands);
}

function complexityOf(fn, sourceCode)
{
	const visitorKeys = sourceCode.visitorKeys;
	let complexity = 0;

	const visitAll = (nodes, nesting) => nodes.forEach((node) => visit(node, nesting));

	function visit(node, nesting)
	{
		if (!node || isFunction(node))
		{
			return;
		}

		switch (node.type)
		{
			case 'IfStatement':
			{
				const isElseIf = node.parent.type === 'IfStatement' && node.parent.alternate === node;
				complexity += isElseIf ? 1 : 1 + nesting;
				visit(node.test, nesting);
				visit(node.consequent, nesting + 1);
				if (node.alternate?.type === 'IfStatement')
				{
					visit(node.alternate, nesting);
				}
				else if (node.alternate)
				{
					complexity += 1;
					visit(node.alternate, nesting + 1);
				}

				return;
			}
			case 'ForStatement':
			case 'ForInStatement':
			case 'ForOfStatement':
			case 'WhileStatement':
			case 'DoWhileStatement':
				complexity += 1 + nesting;
				visitAll(children(node, visitorKeys).filter((child) => child !== node.body), nesting);
				visit(node.body, nesting + 1);

				return;
			case 'SwitchStatement':
				complexity += 1 + nesting;
				visit(node.discriminant, nesting);
				visitAll(node.cases, nesting + 1);

				return;
			case 'CatchClause':
				complexity += 1 + nesting;
				visit(node.param, nesting);
				visit(node.body, nesting + 1);

				return;
			case 'ConditionalExpression':
				complexity += 1 + nesting;
				visit(node.test, nesting);
				visit(node.consequent, nesting + 1);
				visit(node.alternate, nesting + 1);

				return;
			case 'BreakStatement':
			case 'ContinueStatement':
				if (node.label)
				{
					complexity += 1;
				}

				return;
			case 'LogicalExpression':
			{
				if (isDefaultValue(node, sourceCode))
				{
					break;
				}

				const operators = [];
				const operands = [];
				flattenLogical(node, operators, operands);
				complexity += operators.filter((operator, index) => operator !== operators[index - 1]).length;
				visitAll(operands, nesting);

				return;
			}
			default:
				break;
		}

		visitAll(children(node, visitorKeys), nesting);
	}

	visit(fn.body, 0);

	return complexity;
}

export default {
	meta: {
		type: 'suggestion',
		docs: { description: 'Cognitive Complexity of functions should not be too high' },
		schema: [{ type: 'integer', minimum: 0 }],
		messages: {
			refactorFunction: 'Refactor this function to reduce its Cognitive Complexity from {{complexity}} to the {{threshold}} allowed.',
		},
	},
	create(context)
	{
		const threshold = context.options[0] ?? DEFAULT_THRESHOLD;
		const sourceCode = context.sourceCode;

		const check = (node) => {
			const complexity = complexityOf(node, sourceCode);
			if (complexity > threshold)
			{
				context.report({
					loc: functionLocation(node, sourceCode),
					messageId: 'refactorFunction',
					data: { complexity: String(complexity), threshold: String(threshold) },
				});
			}
		};

		return {
			FunctionDeclaration: check,
			FunctionExpression: check,
			ArrowFunctionExpression: check,
		};
	},
};
