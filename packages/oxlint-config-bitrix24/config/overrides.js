// Tools that lint Flow files present them as TypeScript under a `*.js.ts` name.
// Such files are still JavaScript for the purposes of the overrides below.
const FLOW_AS_TS = '**/*.js.ts';

// TypeScript files: rules the TypeScript compiler already enforces.
export const typescript = {
	files: ['**/*.ts'],
	excludeFiles: [FLOW_AS_TS],
	rules: {
		'import/named': 'off',
		'import/namespace': 'off',
		'import/default': 'off',
		'import/export': 'off',

		'getter-return': 'off',
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
		'no-this-before-super': 'off',
		'no-undef': 'off',
		'no-dupe-class-members': 'off',
		'no-loss-of-precision': 'off',
		'no-redeclare': 'off',
		'no-unused-vars': 'off',
	},
};

// Legacy JS files outside src/: compiled bundles and non-ESM code.
// BX direct usage and IO without polyfill are allowed.
export const legacyScripts = {
	files: ['**/*.js', FLOW_AS_TS],
	excludeFiles: ['**/src/**', '**/*.es6.js', '**/*.es6.js.ts'],
	rules: {
		'@bitrix24/bitrix24-rules/no-bx': 'off',
		'@bitrix24/bitrix24-rules/no-io-without-polyfill': 'off',
	},
};

// Build and tool config files: Node.js environment, default exports and
// non-aliased imports are allowed.
export const tooling = {
	files: [
		'**/bundle.config.{js,ts}',
		'**/chef.config.{js,ts}',
		'**/playwright.config.{js,ts}',
		'eslint.config.{js,ts}',
		'oxlint.config.ts',
	],
	env: { node: true },
	rules: {
		'@bitrix24/bitrix24-rules/need-alias': 'off',
		'import/no-default-export': 'off',
	},
};

// Test files: Mocha globals and relaxed complexity rules.
export const testing = {
	files: [
		'**/test/**/*.{js,ts}',
		'**/tests/**/*.{js,ts}',
	],
	env: { mocha: true },
	globals: {
		assert: 'readonly',
		sinon: 'readonly',
		loadMessages: 'readonly',
	},
	rules: {
		'max-lines-per-function': 'off',
		'complexity': 'off',
	},
};

export const overrides = [typescript, legacyScripts, tooling, testing];
