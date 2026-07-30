jn.define('tasks/reports', (require, exports, module) => {
	const { Loc } = require('loc');

	module.exports = {
		Reports: { Loc },
		open: () => requireLazy('tasks/task'),
	};
});
