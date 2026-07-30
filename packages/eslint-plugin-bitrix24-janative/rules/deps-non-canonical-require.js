import { createRequestVisitor } from './lib/deps-request.js';

export default {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Require an extension by the path it declares with jn.define()',
			recommended: true,
		},
		schema: [],
		fixable: 'code',
		messages: {
			nonCanonical: "'{{path}}' is not the name this file declares: use '{{canonical}}'.",
		},
	},

	create(context)
	{
		const report = (request, { node, path }) => {
			if (request.canonical === null)
			{
				return;
			}

			const [argument] = node.arguments;
			const quote = argument.raw?.[0] ?? "'";

			context.report({
				node,
				messageId: 'nonCanonical',
				data: { path, canonical: request.canonical },
				fix: fixer => fixer.replaceText(argument, `${quote}${request.canonical}${quote}`),
			});
		};

		// Annotations are written the way deps.php spells them, so they are not held to this.
		return createRequestVisitor(context, report, { annotations: false });
	},
};
