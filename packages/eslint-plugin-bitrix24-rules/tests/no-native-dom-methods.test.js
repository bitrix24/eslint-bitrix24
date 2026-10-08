import { RuleTester } from 'eslint';
import rule from '../rules/no-native-dom-methods.js';
import { createRequire } from 'node:module';
import { valid, invalid } from './no-native-dom-methods.cases.js';

const require = createRequire(import.meta.url);

const ruleTester = new RuleTester({
	parser: require.resolve('@babel/eslint-parser'),
	parserOptions: {
		ecmaVersion: 2022,
		sourceType: 'module',
		requireConfigFile: false,
		babelOptions: {
			parserOpts: {
				plugins: ['flow'],
			},
		},
	},
});

const error = { messageId: 'moduleError' };

ruleTester.run('no-native-dom-methods', rule, {
	valid: [
		...valid,
		// Flow maybe types
		'export function f(node: ?BBCodeNode) { node.appendChild(child); }',
	],
	invalid: [
		...invalid,
		{ code: 'export function f(node: ?HTMLElement) { node.appendChild(child); }', errors: [error] },
	],
});
