// Disallows `this` where its value is `undefined`: outside of classes and class-like objects.
//
// In strict code (modules, classes, "use strict") `this` is reported
// - at the top level of a module;
// - in a function called without a receiver: not a method, not a constructor
//   (a capitalized name when `capIsConstructor` is on), not assigned to a property,
//   not bound with bind/call/apply, not a callback of an array method given a `thisArg`,
//   not marked with a `@this` comment.
// In sloppy code `this` is the global object and is never reported.
// Arrow functions take `this` of the code around them.
//
// Unlike ESLint's rule, a TypeScript function that declares a `this` parameter is not reported.
//
// Options: `capIsConstructor` (default true).

const THIS_TAG = /^[\s*]*@this/mu;
const METHODS_WITH_THIS_ARG = /^(?:every|filter|find(?:Last)?(?:Index)?|flatMap|forEach|map|some)$/u;
const BINDING_METHODS = /^(?:bind|call|apply)$/u;

const startsWithUpperCase = (name) => name.charAt(0) !== name.charAt(0).toLocaleLowerCase();

const isFunction = (node) => node.type === 'FunctionDeclaration'
	|| node.type === 'FunctionExpression'
	|| node.type === 'ArrowFunctionExpression';

function propertyName(member)
{
	if (!member.computed && member.property.type === 'Identifier')
	{
		return member.property.name;
	}

	if (member.computed && member.property.type === 'Literal' && typeof member.property.value === 'string')
	{
		return member.property.value;
	}

	return null;
}

function isMemberCall(callee, objectName, pattern)
{
	const member = callee.type === 'ChainExpression' ? callee.expression : callee;
	if (member.type !== 'MemberExpression')
	{
		return false;
	}

	if (objectName && (member.object.type !== 'Identifier' || member.object.name !== objectName))
	{
		return false;
	}

	const name = propertyName(member);

	return name !== null && pattern.test(name);
}

function isNullOrUndefined(node)
{
	return (node.type === 'Literal' && node.value === null)
		|| (node.type === 'Identifier' && node.name === 'undefined')
		|| (node.type === 'UnaryExpression' && node.operator === 'void');
}

const isCallee = (node) => node.parent?.type === 'CallExpression' && node.parent.callee === node;

function upperFunction(node)
{
	for (let current = node.parent; current; current = current.parent)
	{
		if (isFunction(current))
		{
			return current;
		}
	}

	return null;
}

function hasThisTag(node, sourceCode)
{
	// a JSDoc block sits before the statement that declares the function
	let owner = node;
	while (owner.parent && /^(?:VariableDeclarator|VariableDeclaration|ExportNamedDeclaration|ExportDefaultDeclaration|AssignmentExpression|ExpressionStatement)$/u.test(owner.parent.type))
	{
		owner = owner.parent;
	}

	const comments = [...sourceCode.getCommentsBefore(node)];
	if (owner !== node)
	{
		comments.push(...sourceCode.getCommentsBefore(owner));
	}

	return comments.some((comment) => THIS_TAG.test(comment.value));
}

// true when the function gets no receiver: `this` in it is `undefined` in strict code
function hasDefaultThisBinding(node, sourceCode, capIsConstructor)
{
	if (capIsConstructor && node.id && startsWithUpperCase(node.id.name))
	{
		return false;
	}

	if (node.params[0]?.type === 'Identifier' && node.params[0].name === 'this')
	{
		return false;
	}

	if (hasThisTag(node, sourceCode))
	{
		return false;
	}

	const isAnonymous = !node.id;
	let current = node;
	while (current)
	{
		const parent = current.parent;
		switch (parent.type)
		{
			case 'LogicalExpression':
			case 'ChainExpression':
				current = parent;
				break;
			case 'ConditionalExpression':
				if (parent.test === current)
				{
					return true;
				}

				current = parent;
				break;
			case 'ReturnStatement':
			{
				// a function returned by an immediately invoked one: `foo.bar = (function() { return function() {}; })()`
				const outer = upperFunction(parent);
				if (!outer || !isCallee(outer))
				{
					return true;
				}

				current = outer.parent;
				break;
			}
			case 'ArrowFunctionExpression':
				if (parent.body !== current || !isCallee(parent))
				{
					return true;
				}

				current = parent.parent;
				break;
			case 'Property':
			case 'PropertyDefinition':
			case 'MethodDefinition':
			case 'AccessorProperty':
				return parent.value !== current;
			case 'AssignmentExpression':
			case 'AssignmentPattern':
				if (parent.left.type === 'MemberExpression')
				{
					return false;
				}

				return !(capIsConstructor && isAnonymous && parent.left.type === 'Identifier' && startsWithUpperCase(parent.left.name));
			case 'VariableDeclarator':
				return !(capIsConstructor
					&& isAnonymous
					&& parent.init === current
					&& parent.id.type === 'Identifier'
					&& startsWithUpperCase(parent.id.name));
			case 'MemberExpression':
			{
				if (parent.object !== current || !isMemberCall(parent, null, BINDING_METHODS))
				{
					return true;
				}

				const callee = parent.parent.type === 'ChainExpression' ? parent.parent : parent;
				const call = callee.parent;

				return !(isCallee(callee) && call.arguments.length > 0 && !isNullOrUndefined(call.arguments[0]));
			}
			case 'CallExpression':
			{
				const { callee, arguments: args } = parent;
				if (isMemberCall(callee, 'Reflect', /^apply$/u))
				{
					return args.length !== 3 || args[0] !== current || isNullOrUndefined(args[1]);
				}

				if (isMemberCall(callee, 'Array', /^from$/u))
				{
					return args.length !== 3 || args[1] !== current || isNullOrUndefined(args[2]);
				}

				if (isMemberCall(callee, null, METHODS_WITH_THIS_ARG))
				{
					return args.length !== 2 || args[0] !== current || isNullOrUndefined(args[1]);
				}

				return true;
			}
			default:
				return true;
		}
	}

	return true;
}

function hasUseStrict(body)
{
	for (const statement of body)
	{
		if (statement.type !== 'ExpressionStatement' || typeof statement.directive !== 'string')
		{
			return false;
		}

		if (statement.directive === 'use strict')
		{
			return true;
		}
	}

	return false;
}

function isStrict(node, program)
{
	if (program.sourceType === 'module' || hasUseStrict(program.body))
	{
		return true;
	}

	for (let current = node; current; current = current.parent)
	{
		if (current.type === 'ClassBody')
		{
			return true;
		}

		if (isFunction(current) && current.body.type === 'BlockStatement' && hasUseStrict(current.body.body))
		{
			return true;
		}
	}

	return false;
}

export default {
	meta: {
		type: 'suggestion',
		docs: { description: 'Disallow use of `this` in contexts where the value of `this` is `undefined`' },
		schema: [
			{
				type: 'object',
				properties: {
					capIsConstructor: { type: 'boolean' },
				},
				additionalProperties: false,
			},
		],
		messages: {
			unexpectedThis: "Unexpected 'this'.",
		},
	},
	create(context)
	{
		const capIsConstructor = context.options[0]?.capIsConstructor ?? true;
		const sourceCode = context.sourceCode;
		const program = sourceCode.ast;
		const validity = new Map();

		const isValidIn = (owner) => {
			if (!validity.has(owner))
			{
				validity.set(owner, !isStrict(owner, program) || !hasDefaultThisBinding(owner, sourceCode, capIsConstructor));
			}

			return validity.get(owner);
		};

		return {
			ThisExpression(node)
			{
				let child = node;
				for (let current = node.parent; current; child = current, current = current.parent)
				{
					if (current.type === 'FunctionDeclaration' || current.type === 'FunctionExpression')
					{
						if (!isValidIn(current))
						{
							context.report({ node, messageId: 'unexpectedThis' });
						}

						return;
					}

					// class field initializers and static blocks have the instance or the class as `this`
					if (current.type === 'StaticBlock')
					{
						return;
					}

					if ((current.type === 'PropertyDefinition' || current.type === 'AccessorProperty') && current.value === child)
					{
						return;
					}
				}

				if (isStrict(node, program))
				{
					context.report({ node, messageId: 'unexpectedThis' });
				}
			},
		};
	},
};
