module.exports = {
	plugins: [
		'import',
	],
	extends: [
		'plugin:import/recommended',
	],
	rules: {
		// https://github.com/import-js/eslint-plugin-import#rules
		'import/prefer-default-export': 'off',
		'import/no-unresolved': 'off',
	},
};
