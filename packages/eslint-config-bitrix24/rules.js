import globals from 'globals';
import bitrix24Rules from '@bitrix24/eslint-plugin-bitrix24-rules';
import importPlugin from 'eslint-plugin-import';
import promisePlugin from 'eslint-plugin-promise';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';
import vuePlugin from 'eslint-plugin-vue';

import { rules as errorRules } from './rules/errors.js';
import { rules as bestPracticeRules } from './rules/best-practices.js';
import { rules as es6Rules } from './rules/es6.js';
import { rules as variableRules } from './rules/variables.js';
import { rules as styleRules } from './rules/style.js';
import { rules as bitrixRules } from './rules/bitrix.js';
import { rules as unicornRules } from './rules/plugins/unicorn.js';
import { rules as importRules } from './rules/plugins/import.js';
import { rules as promiseRules } from './rules/plugins/promise.js';
import { rules as sonarjsRules } from './rules/plugins/sonarjs.js';
import { rules as vueRules } from './rules/plugins/vue.js';

export default [
	{
		name: 'bitrix24/rules',
		languageOptions: {
			sourceType: 'module',
			ecmaVersion: 'latest',
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
			'vue': vuePlugin,
		},
		rules: {
			...errorRules,
			...bestPracticeRules,
			...es6Rules,
			...variableRules,
			...styleRules,
			...bitrixRules,
			...unicornRules,

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

			...importRules,
			...promiseRules,
			...sonarjsRules,
			...vueRules,
		},
	},
];
