import { REQUEST, createRequestVisitor } from './lib/deps-request.js';

export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Report a dependency that is used but not listed in deps.php',
			recommended: true,
		},
		schema: [],
		messages: {
			missing: "'{{depsPath}}' is required here but is not listed in deps.php. Run `janative-deps sync` to add it.",
		},
	},

	create(context)
	{
		return createRequestVisitor(context, (verdict, { node }) => {
			if (verdict.kind === REQUEST.MISSING_ENTRY)
			{
				context.report({ node, messageId: 'missing', data: { depsPath: verdict.depsPath } });
			}
		});
	},
};
