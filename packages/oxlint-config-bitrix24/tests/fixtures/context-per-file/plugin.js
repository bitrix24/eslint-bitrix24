import { withLegacyNames } from '../../../plugins/legacy-names.js';

// Caches per-file data by its context, the way eslint-plugin-vue keeps the
// `@vue/component` comments of a file.
const firstComments = new WeakMap();

export default withLegacyNames({
	meta: { name: 'probe' },
	rules: {
		'first-comment': {
			create(context)
			{
				if (!firstComments.has(context))
				{
					firstComments.set(context, context.sourceCode.getAllComments()[0]?.value.trim() ?? '');
				}

				return {
					Program(node)
					{
						context.report({ node, message: firstComments.get(context) });
					},
				};
			},
		},
	},
}, (name) => name);
