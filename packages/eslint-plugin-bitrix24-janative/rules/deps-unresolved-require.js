import { REQUEST, createRequestVisitor } from './lib/deps-request.js';

export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Report a required extension that does not exist in the project',
			recommended: true,
		},
		schema: [],
		messages: {
			unresolved: "Cannot find '{{path}}': no file declares it with jn.define().",
		},
	},

	create(context)
	{
		return createRequestVisitor(context, (verdict, { node, path }) => {
			if (verdict.kind === REQUEST.UNRESOLVED)
			{
				context.report({ node, messageId: 'unresolved', data: { path } });
			}
		});
	},
};
