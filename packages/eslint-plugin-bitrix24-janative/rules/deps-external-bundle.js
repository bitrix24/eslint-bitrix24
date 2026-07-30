import { REQUEST, createKindRule } from './lib/deps-request.js';

export default createKindRule({
	kind: REQUEST.EXTERNAL_BUNDLE,
	description: 'Report a bundle file required from another extension',
	messageId: 'external',
	message: "'{{path}}' is a bundle file of another extension. Expose it as an extension or move it here.",
});
