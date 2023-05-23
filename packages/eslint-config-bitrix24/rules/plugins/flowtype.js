module.exports = {
	plugins: [
		'flowtype',
	],
	extends: [
		'plugin:flowtype/recommended',
	],
	rules: {
		'flowtype/no-types-missing-file-annotation': 'off',
		'flowtype/require-return-type': [
			'warn',
			'always',
			{
				excludeArrowFunctions: true,
				annotateUndefined: 'ignore',
			},
		],
	},
};
