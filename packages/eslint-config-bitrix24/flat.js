const babelParser = require('@babel/eslint-parser');
const bitrix24Rules = require('@bitrix24/eslint-plugin-bitrix24-rules');
const importPlugin = require('eslint-plugin-import');
const promisePlugin = require('eslint-plugin-promise');
const sonarjsPlugin = require('eslint-plugin-sonarjs');
const unicornPlugin = require('eslint-plugin-unicorn');
const vuePlugin = require('eslint-plugin-vue');
const globals = require('globals');

const errors = require('./rules/errors');
const bestPractices = require('./rules/best-practices');
const es6 = require('./rules/es6');
const variables = require('./rules/variables');
const style = require('./rules/style');
const bitrix = require('./rules/bitrix');
const unicornRules = require('./rules/plugins/unicorn');
const importRules = require('./rules/plugins/import');
const promiseRules = require('./rules/plugins/promise');
const sonarjsRules = require('./rules/plugins/sonarjs');
const vueRules = require('./rules/plugins/vue');

module.exports = [
	{
		languageOptions: {
			parser: babelParser,
			sourceType: 'module',
			ecmaVersion: 2022,
			parserOptions: {
				requireConfigFile: false,
				babelOptions: {
					plugins: ['@babel/plugin-syntax-flow'],
				},
			},
			globals: {
				...globals.browser,
				...globals.es2021,
				BX: 'readonly',
			},
		},
		plugins: {
			'@bitrix24/bitrix24-rules': bitrix24Rules,
			'import': importPlugin,
			'promise': promisePlugin,
			'sonarjs': sonarjsPlugin,
			'unicorn': unicornPlugin,
		},
		rules: {
			// Core ESLint rules
			...errors.rules,
			...bestPractices.rules,
			...es6.rules,
			...variables.rules,
			...style.rules,

			// Bitrix24 rules
			...bitrix.rules,

			// Unicorn rules
			...unicornRules.rules,

			// Brace rules (moved from @saji/brace-rules to bitrix24-rules)
			'@bitrix24/bitrix24-rules/brace-on-same-line': ['error', {
				FunctionExpression: 'ignore',
				FunctionDeclaration: 'never',
				ArrowFunctionExpression: 'always',
				IfStatement: 'never',
				TryStatement: 'never',
				DoWhileStatement: 'never',
				WhileStatement: 'never',
				WithStatement: 'never',
				ForStatement: 'never',
				ForInStatement: 'never',
				ForOfStatement: 'never',
				SwitchStatement: 'never',
				ClassDeclaration: 'never',
				MethodDeclaration: 'never',
				ExportClass: 'never',
				ExportClassAnon: 'never',
				ExportFunctionAnon: 'never',
			}],

			// Import recommended + overrides
			'import/no-unresolved': 'off',
			'import/named': 'error',
			'import/namespace': 'error',
			'import/default': 'error',
			'import/export': 'error',
			'import/no-named-as-default': 'warn',
			'import/no-named-as-default-member': 'warn',
			'import/no-duplicates': 'warn',
			'import/prefer-default-export': 'off',
			'import/no-default-export': 'warn',

			// Promise recommended + overrides
			'promise/always-return': 'off',
			'promise/no-return-wrap': 'error',
			'promise/param-names': 'error',
			'promise/catch-or-return': ['error', { allowFinally: true }],
			'promise/no-native': 'off',
			'promise/no-nesting': 'warn',
			'promise/no-promise-in-callback': 'warn',
			'promise/no-callback-in-promise': 'warn',
			'promise/avoid-new': 'off',
			'promise/no-new-statics': 'error',
			'promise/no-return-in-finally': 'warn',
			'promise/valid-params': 'warn',

			// Sonarjs recommended + overrides
			'sonarjs/cognitive-complexity': 'warn',
			'sonarjs/elseif-without-else': 'off',
			'sonarjs/max-switch-cases': 'error',
			'sonarjs/no-all-duplicated-branches': 'error',
			'sonarjs/no-collapsible-if': 'error',
			'sonarjs/no-collection-size-mischeck': 'error',
			'sonarjs/no-duplicate-string': 'off',
			'sonarjs/no-duplicated-branches': 'error',
			'sonarjs/no-element-overwrite': 'error',
			'sonarjs/no-empty-collection': 'error',
			'sonarjs/no-extra-arguments': 'error',
			'sonarjs/no-gratuitous-expressions': 'error',
			'sonarjs/no-identical-conditions': 'error',
			'sonarjs/no-identical-expressions': 'error',
			'sonarjs/no-identical-functions': 'error',
			'sonarjs/no-ignored-return': 'error',
			'sonarjs/no-inverted-boolean-check': 'error',
			'sonarjs/no-nested-switch': 'error',
			'sonarjs/no-nested-template-literals': 'error',
			'sonarjs/no-one-iteration-loop': 'error',
			'sonarjs/no-redundant-boolean': 'error',
			'sonarjs/no-redundant-jump': 'error',
			'sonarjs/no-same-line-conditional': 'error',
			'sonarjs/no-small-switch': 'error',
			'sonarjs/no-unused-collection': 'error',
			'sonarjs/no-use-of-empty-return-value': 'error',
			'sonarjs/no-useless-catch': 'error',
			'sonarjs/non-existent-operator': 'error',
			'sonarjs/prefer-immediate-return': 'error',
			'sonarjs/prefer-object-literal': 'error',
			'sonarjs/prefer-single-boolean-return': 'error',
			'sonarjs/prefer-while': 'error',
		},
	},

	// Vue flat config
	...vuePlugin.configs['flat/recommended'].map((config) => ({
		...config,
		files: ['**/*.vue'],
	})),

	// Vue overrides
	{
		files: ['**/*.vue'],
		languageOptions: {
			parserOptions: {
				parser: babelParser,
				requireConfigFile: false,
				babelOptions: {
					plugins: ['@babel/plugin-syntax-flow'],
				},
			},
		},
		rules: {
			...vueRules.rules,
		},
	},
];
