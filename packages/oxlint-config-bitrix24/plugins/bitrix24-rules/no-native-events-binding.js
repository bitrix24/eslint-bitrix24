// `addEventListener`/`removeEventListener` of DOM objects. Calls, peer connections, media
// tracks, sockets and other event targets of their own are not reported when the file
// shows what they are (see receiver.js), nor `this.addEventListener()` in a class declaring
// it itself.
import { createReceiverClassifier, CUSTOM, enclosingClass, findClassMember, METHOD_TYPES } from './receiver.js';

const METHODS = new Set(['addEventListener', 'removeEventListener']);

export function create(context)
{
	const classify = createReceiverClassifier(context);

	return {
		MemberExpression(node)
		{
			if (node.computed || !METHODS.has(node.property.name))
			{
				return;
			}

			const classBody = node.object.type === 'ThisExpression' ? enclosingClass(node) : null;
			if (classBody && findClassMember(classBody, node.property.name, METHOD_TYPES))
			{
				return;
			}

			if (classify(node.object) === CUSTOM)
			{
				return;
			}

			context.report({ node: node.property, messageId: `${context.sourceCode.ast.sourceType}Error` });
		},
	};
}
