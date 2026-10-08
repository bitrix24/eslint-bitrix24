import { run } from './run.js';

const error = { messageId: 'error' };

run('no-bx', {
	valid: [
		// reported by no-bx-message
		'BX.message("KEY"); export {};',
		'BX.SidePanel.Instance.open(url); export {};',
	],
	invalid: [
		{ code: 'BX.create("div"); export {};', errors: [error] },
		{ code: 'BX.addCustomEvent("onEvent", h); export {};', errors: [error] },
	],
});
