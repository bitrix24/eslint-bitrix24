import { run } from './run.js';

const error = { messageId: 'moduleError' };

run('no-native-dialogs', {
	valid: [
		'showAlert("text"); export {};',
		'onConfirm(); confirmBox.show(); export {};',
		'BX.message("KEY"); export {};',
		'this.parentNode.confirmDelete(); export {};',
		'export function f(alert) { alert("text"); }',
		'import { confirm } from "./dialogs"; confirm("Delete?");',
	],
	invalid: [
		{ code: 'alert("text"); export {};', errors: [error] },
		{ code: 'if (confirm("Delete?")) {} export {};', errors: [error] },
		{ code: 'window.alert("text"); export {};', errors: [error] },
		{ code: 'top.confirm("Delete?"); export {};', errors: [error] },
	],
});
