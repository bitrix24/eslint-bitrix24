// `element.style.*`. A private `#style` field and the `style` of an object known not to be
// a DOM one (`options.style.color`, see receiver.js) are not reported.
import { createReceiverClassifier, CUSTOM } from './receiver.js';

export function create(context)
{
	const classify = createReceiverClassifier(context);

	return {
		MemberExpression(node)
		{
			const style = node.object;
			if (
				style.type !== 'MemberExpression'
				|| style.computed
				|| style.property.type !== 'Identifier'
				|| style.property.name !== 'style'
				|| !node.property.name
			)
			{
				return;
			}

			if (classify(style.object) === CUSTOM)
			{
				return;
			}

			context.report({ node: style.property, messageId: `${context.sourceCode.ast.sourceType}Error` });
		},
	};
}
