import { auditExtension } from '../core/audit.js';
import { depsContextOf, sourceCodeOf } from './lib/deps-request.js';

export default {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Report a deps.php entry that nothing in the extension uses',
			recommended: true,
		},
		schema: [],
		messages: {
			unused: "'{{depsPath}}' is listed in deps.php but nothing in this extension uses it. Remove it, or mark it `// @keep`.",
		},
	},

	create(context)
	{
		const depsContext = depsContextOf(context);

		// The verdict covers the whole extension, so it is delivered once, at its entry point.
		if (depsContext === null || depsContext.filename !== depsContext.extension.entryFile)
		{
			return {};
		}

		return {
			'Program:exit'(node)
			{
				// The entry point is judged by what it says now, its neighbours by what is on disk.
				// ESLint has already parsed this file - hand the tree over instead of the text.
				const overrides = new Map([[depsContext.filename, sourceCodeOf(context).ast]]);
				const audit = auditExtension(depsContext.extension, depsContext.resolver, { overrides });

				for (const depsPath of audit.unused)
				{
					context.report({
						node,
						loc: { line: 1, column: 0 },
						messageId: 'unused',
						data: { depsPath },
					});
				}
			},
		};
	},
};
