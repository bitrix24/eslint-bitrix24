// Requires a function to either always or never return a value.
//
// Reports
// - a `return;` in a function that also has `return <value>;`, and the other way round;
// - a function that returns a value somewhere but can also reach its end.
//
// Unlike ESLint's consistent-return, the "can reach its end" check is a structural
// analysis of the function body, not a code path analysis: it understands return/throw,
// if/else, blocks, try/catch/finally, switch with default, and infinite loops without
// break. Anything else is treated as possibly completing normally.
//
// Options: `treatUndefinedAsUnspecified` (default false) treats `return undefined;` and
// `return void x;` as `return;`.

function isUndefinedValue(node)
{
	return (node.type === 'Identifier' && node.name === 'undefined')
		|| (node.type === 'UnaryExpression' && node.operator === 'void');
}

function functionName(node)
{
	const parent = node.parent;
	if (node.type === 'ArrowFunctionExpression')
	{
		return 'Arrow function';
	}

	if (parent && (parent.type === 'MethodDefinition' || parent.type === 'Property') && parent.value === node)
	{
		const kind = parent.kind === 'get' ? 'Getter' : (parent.kind === 'set' ? 'Setter' : 'Method');
		const key = parent.key.type === 'Identifier' && !parent.computed ? parent.key.name : null;

		return key ? `${kind} '${key}'` : kind;
	}

	const id = node.id ?? (parent?.type === 'VariableDeclarator' && parent.id.type === 'Identifier' ? parent.id : null);

	return id ? `Function '${id.name}'` : 'Function';
}

function containsBreak(node, label)
{
	let found = false;
	const visit = (current, insideNestedLoop) => {
		if (!current || found || typeof current !== 'object')
		{
			return;
		}

		if (current.type === 'BreakStatement')
		{
			if ((current.label && current.label.name === label) || (!current.label && !insideNestedLoop))
			{
				found = true;
			}

			return;
		}

		if (/Function/u.test(current.type ?? ''))
		{
			return;
		}

		const nested = insideNestedLoop || /^(While|DoWhile|For|ForIn|ForOf)Statement$|^SwitchStatement$/u.test(current.type ?? '');
		for (const key of Object.keys(current))
		{
			if (key === 'parent' || key === 'loc' || key === 'range')
			{
				continue;
			}

			const value = current[key];
			if (Array.isArray(value))
			{
				value.forEach((child) => visit(child, nested));
			}
			else if (value && typeof value === 'object' && typeof value.type === 'string')
			{
				visit(value, nested);
			}
		}
	};

	if (node.type === 'SwitchStatement')
	{
		node.cases.forEach((switchCase) => switchCase.consequent.forEach((statement) => visit(statement, false)));
	}
	else
	{
		visit(node.body, false);
	}

	return found;
}

// true when control can never leave `node` normally (it always returns or throws)
function alwaysExits(node, label = null)
{
	if (!node)
	{
		return false;
	}

	switch (node.type)
	{
		case 'ReturnStatement':
		case 'ThrowStatement':
			return true;
		case 'BlockStatement':
		case 'StaticBlock':
			return node.body.some((statement) => alwaysExits(statement));
		case 'IfStatement':
			return alwaysExits(node.consequent) && alwaysExits(node.alternate);
		case 'LabeledStatement':
			return alwaysExits(node.body, node.label.name);
		case 'TryStatement':
			if (node.finalizer && alwaysExits(node.finalizer))
			{
				return true;
			}

			return alwaysExits(node.block) && (!node.handler || alwaysExits(node.handler.body));
		case 'SwitchStatement':
		{
			const hasDefault = node.cases.some((switchCase) => switchCase.test === null);
			if (!hasDefault || containsBreak(node, label))
			{
				return false;
			}

			const last = node.cases.at(-1);

			return last.consequent.some((statement) => alwaysExits(statement));
		}
		case 'WhileStatement':
		case 'ForStatement':
		{
			const test = node.test;
			const infinite = test === null || (test.type === 'Literal' && test.value === true);

			return infinite && !containsBreak(node, label);
		}
		case 'DoWhileStatement':
			return alwaysExits(node.body) || (node.test.type === 'Literal' && node.test.value === true && !containsBreak(node, label));
		default:
			return false;
	}
}

export default {
	meta: {
		type: 'suggestion',
		docs: { description: 'Require return statements to either always or never specify values' },
		schema: [
			{
				type: 'object',
				properties: {
					treatUndefinedAsUnspecified: { type: 'boolean' },
				},
				additionalProperties: false,
			},
		],
		messages: {
			missingReturn: 'Expected to return a value at the end of {{name}}.',
			missingReturnValue: '{{name}} expected a return value.',
			unexpectedReturnValue: '{{name}} expected no return value.',
		},
	},
	create(context)
	{
		const treatUndefinedAsUnspecified = context.options[0]?.treatUndefinedAsUnspecified ?? false;
		const stack = [];

		const enter = (node) => {
			stack.push({ node, first: null });
		};

		const exit = (node) => {
			const info = stack.pop();
			if (!info.first || !info.first.hasValue)
			{
				return;
			}

			if (node.body.type !== 'BlockStatement')
			{
				return;
			}


			if (!alwaysExits(node.body))
			{
				const name = functionName(node);
				context.report({
					node,
					loc: node.id?.loc ?? { start: node.loc.start, end: node.loc.start },
					messageId: 'missingReturn',
					data: { name: name.charAt(0).toLowerCase() + name.slice(1) },
				});
			}
		};

		return {
			FunctionDeclaration: enter,
			FunctionExpression: enter,
			ArrowFunctionExpression: enter,
			'FunctionDeclaration:exit': exit,
			'FunctionExpression:exit': exit,
			'ArrowFunctionExpression:exit': exit,

			ReturnStatement(node)
			{
				const info = stack.at(-1);
				if (!info)
				{
					return;
				}

				const argument = node.argument;
				const hasValue = Boolean(argument) && !(treatUndefinedAsUnspecified && isUndefinedValue(argument));

				if (!info.first)
				{
					info.first = { hasValue };

					return;
				}

				if (info.first.hasValue !== hasValue)
				{
					context.report({
						node,
						messageId: hasValue ? 'unexpectedReturnValue' : 'missingReturnValue',
						data: { name: functionName(info.node) },
					});
				}
			},
		};
	},
};
