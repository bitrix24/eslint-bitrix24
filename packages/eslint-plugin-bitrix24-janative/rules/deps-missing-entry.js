import { REQUEST, createKindRule } from './lib/deps-request.js';

export default createKindRule({
	kind: REQUEST.MISSING_ENTRY,
	description: 'Report a dependency that is used but not listed in deps.php',
	messageId: 'missing',
	message: "'{{depsPath}}' is required here but is not listed in deps.php. Run `janative-deps sync` to add it.",
	data: verdict => ({ depsPath: verdict.depsPath }),
});
