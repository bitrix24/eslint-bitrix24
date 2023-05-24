module.exports = {
	parser: '@babel/eslint-parser',
	parserOptions: {
		sourceType: 'module',
		requireConfigFile: false,
	},
	extends: [
		'./rules/best-practices.js',
		'./rules/bitrix.js',
		'./rules/errors.js',
		'./rules/es6.js',
		'./rules/style.js',
		'./rules/variables.js',

		'./rules/plugins/brace-rules.js',
		'./rules/plugins/flowtype.js',
		'./rules/plugins/import.js',
		'./rules/plugins/promise.js',
		'./rules/plugins/sonarjs.js',
		'./rules/plugins/unicorn.js',
		'./rules/plugins/vue.js',
	].map(require.resolve),

	rules: {},
};
