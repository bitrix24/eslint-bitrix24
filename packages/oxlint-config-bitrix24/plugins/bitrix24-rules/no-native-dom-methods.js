// Native DOM methods changing the children of a node. Custom trees (BBCode nodes, models)
// often have methods of the same names, so a call is not reported when:
// - the object is known not to be a DOM one (see receiver.js);
// - the call does not match the native signature: `parent.replaceChild(node, ...nodes)`;
// - it is `this.appendChild()` in a class declaring `appendChild()` itself.
import { createReceiverClassifier, CUSTOM, enclosingClass, findClassMember, METHOD_TYPES } from './receiver.js';

// method -> number of arguments of the native one, null for any
const METHODS = new Map([['appendChild', 1], ['removeChild', 1], ['replaceChild', 2], ['insertBefore', 2], ['replaceChildren', null]]);

export function create(context)
{
	const classify = createReceiverClassifier(context);

	return {
		CallExpression(node)
		{
			const callee = node.callee;
			if (callee.type !== 'MemberExpression' || callee.computed || !METHODS.has(callee.property.name) || callee.object.name === 'Dom')
			{
				return;
			}

			const args = node.arguments;
			const arity = METHODS.get(callee.property.name);
			if (arity !== null && (args.length !== arity || args.some((arg) => arg.type === 'SpreadElement')))
			{
				return;
			}

			const classBody = callee.object.type === 'ThisExpression' ? enclosingClass(node) : null;
			if (classBody && findClassMember(classBody, callee.property.name, METHOD_TYPES))
			{
				return;
			}

			if (classify(callee.object) === CUSTOM)
			{
				return;
			}

			context.report({ node: callee.property, messageId: `${context.sourceCode.ast.sourceType}Error` });
		},
	};
}
