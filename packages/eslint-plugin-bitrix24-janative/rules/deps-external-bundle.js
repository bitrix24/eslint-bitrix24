import { REQUEST, createRequestVisitor } from './lib/deps-request.js';

export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Report a bundle file required from another extension',
			recommended: true,
		},
		schema: [],
		messages: {
			external: "'{{path}}' is a bundle file of another extension. Expose it as an extension or move it here.",
		},
	},

	create(context)
	{
		return createRequestVisitor(context, (verdict, { node, path }) => {
			if (verdict.kind === REQUEST.EXTERNAL_BUNDLE)
			{
				context.report({ node, messageId: 'external', data: { path } });
			}
		});
	},
};
