module.exports = {
	extends: [
		'@bitrix24/bitrix24',
	],
	plugins: [
		'es',
		'@bitrix24/bitrix24-janative',
	],
	globals: {
		jn: 'readonly',
		env: 'readonly',
		layout: 'readonly',
		layoutWidget: 'readonly',
		result: 'readonly',
		LayoutComponent: 'readonly',
	},
	rules: {
		'es/no-nullish-coalescing-operators': 'error',
		'es/no-optional-chaining': 'error',

		'@bitrix24/bitrix24-janative/no-global-require': 'error',
		'@bitrix24/bitrix24-janative/no-static-variable-in-class': 'error',

		'flowtype/require-return-type': 'off',

		'@bitrix24/bitrix24-rules/no-native-events-binding': 'off',
		'@bitrix24/bitrix24-rules/no-typeof': 'off',
		'@bitrix24/bitrix24-rules/no-bx-message': 'off',
		'@bitrix24/bitrix24-rules/no-classlist': 'off',
		'@bitrix24/bitrix24-rules/no-style': 'off',
		'@bitrix24/bitrix24-rules/no-jsdd': 'off',
		'@bitrix24/bitrix24-rules/no-native-dialogs': 'off',
		'@bitrix24/bitrix24-rules/no-native-dom-methods': 'off',
		'@bitrix24/bitrix24-rules/no-eventemitter-without-namespace': 'off',
		'@bitrix24/bitrix24-rules/no-bx': 'off',
	},
};