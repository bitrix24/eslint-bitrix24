import globals from 'globals';

// Test files — Mocha/Chai globals and relaxed complexity rules.
export default {
	name: 'bitrix24/testing',
	languageOptions: {
		sourceType: 'module',
		globals: {
			...globals.mocha,
			assert: 'readonly',
			sinon: 'readonly',
			loadMessages: 'readonly',
		},
	},
	rules: {
		'max-lines-per-function': 'off',
		'sonarjs/cognitive-complexity': 'off',
	},
};
