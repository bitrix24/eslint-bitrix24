import globals from 'globals';

// Build/tool config files — Node.js environment.
// Default exports and non-aliased imports are allowed here.
export default {
	name: 'bitrix24/tooling',
	languageOptions: {
		sourceType: 'module',
		globals: globals.node,
	},
	rules: {
		'@bitrix24/bitrix24-rules/need-alias': 'off',
		'import/no-default-export': 'off',
	},
};
