module.exports = {
	plugins: [
		'@bitrix24/bitrix24-rules',
	],
	rules: {
		'@bitrix24/bitrix24-rules/no-io-without-polyfill': 'error',
		'@bitrix24/bitrix24-rules/no-pseudo-private': 'error',
		'@bitrix24/bitrix24-rules/no-native-events-binding': 'error',
		'@bitrix24/bitrix24-rules/no-typeof': 'error',
		'@bitrix24/bitrix24-rules/no-bx-message': 'error',
		'@bitrix24/bitrix24-rules/no-classlist': 'error',
		'@bitrix24/bitrix24-rules/no-style': 'error',
		'@bitrix24/bitrix24-rules/no-jsdd': 'error',
		'@bitrix24/bitrix24-rules/no-native-dialogs': 'error',
		'@bitrix24/bitrix24-rules/no-native-dom-methods': 'error',
		'@bitrix24/bitrix24-rules/no-eventemitter-without-namespace': 'error',
		'@bitrix24/bitrix24-rules/no-bx': 'error',
		'@bitrix24/bitrix24-rules/need-alias': 'warn',
		'@bitrix24/bitrix24-rules/sort-extension-imports': ['warn', {
			'newlines-between': 'always-and-inside-groups',
			'optional-newlines-for-single-imports': true,
		}],
	},
	globals: {
		BX: 'readonly',
	},
};
