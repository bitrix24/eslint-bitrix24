import { REQUEST, createKindRule } from './lib/deps-request.js';

export default createKindRule({
	kind: REQUEST.UNRESOLVED,
	description: 'Report a required extension that does not exist in the project',
	messageId: 'unresolved',
	message: "Cannot find '{{path}}': no file declares it with jn.define().",
});
