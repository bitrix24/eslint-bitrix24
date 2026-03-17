// Legacy JS files outside src/ — compiled bundles and non-ESM code.
// Relaxed rules: BX direct usage and IO without polyfill are allowed.
export default {
	name: 'bitrix24/legacy-scripts',
	languageOptions: {
		sourceType: 'script',
	},
	rules: {
		'@bitrix24/bitrix24-rules/no-bx': 'off',
		'@bitrix24/bitrix24-rules/no-io-without-polyfill': 'off',
	},
};
