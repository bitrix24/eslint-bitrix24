jn.define('tasks/task', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { inner } = require('tasks/task/inner');

	module.exports = { Task: { Loc, Type, inner } };
});
