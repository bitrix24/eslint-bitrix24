import tseslint from 'typescript-eslint';

export default {
	name: 'bitrix24/typescript',
	languageOptions: {
		parser: tseslint.parser,
	},
	rules: {
		// Import plugin — TS compiler fully handles module resolution.
		'import/named': 'off',
		'import/namespace': 'off',
		'import/default': 'off',
		'import/export': 'off',

		// Core rules fully covered by TS type checking — safe to disable.
		'getter-return': 'off',
		'no-dupe-args': 'off',
		'no-dupe-keys': 'off',
		'no-func-assign': 'off',
		'no-import-assign': 'off',
		'no-obj-calls': 'off',
		'no-setter-return': 'off',
		'no-unreachable': 'off',
		'no-unsafe-negation': 'off',
		'no-new-native-nonconstructor': 'off',
		'constructor-super': 'off',
		'no-class-assign': 'off',
		'no-const-assign': 'off',
		'no-new-symbol': 'off',
		'no-this-before-super': 'off',
		'no-undef': 'off',
		'no-dupe-class-members': 'off',
		'no-loss-of-precision': 'off',
		'no-redeclare': 'off',
		'no-unused-vars': 'off',
	},
};
