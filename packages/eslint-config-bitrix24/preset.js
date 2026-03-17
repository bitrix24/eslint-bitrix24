import bitrix24Rules from './rules.js';
import bitrix24Flow from './flow.js';
import bitrix24TypeScript from './typescript.js';
import bitrix24LegacyScripts from './legacy-scripts.js';
import bitrix24Tooling from './tooling.js';
import bitrix24Testing from './testing.js';

export default [
	...bitrix24Rules,

	// JS/Flow files — Babel parser with Flow syntax support.
	{
		files: ['**/*.js'],
		...bitrix24Flow,
	},

	// TypeScript files — typescript-eslint parser, TS-redundant rules disabled.
	{
		files: ['**/*.ts'],
		...bitrix24TypeScript,
	},

	// Legacy JS files outside src/ — compiled bundles and non-ESM code.
	{
		files: ['**/*.js'],
		ignores: ['**/src/**', '**/*.es6.js'],
		...bitrix24LegacyScripts,
	},

	// Build/tool config files — Node.js environment.
	{
		files: [
			'**/bundle.config.{js,ts}',
			'**/chef.config.{js,ts}',
			'**/playwright.config.{js,ts}',
			'eslint.config.{js,ts}',
		],
		...bitrix24Tooling,
	},

	// Test files — Mocha/Chai globals and relaxed complexity rules.
	{
		files: [
			'**/test/**/*.{js,ts}',
			'**/tests/**/*.{js,ts}',
			'**/tests/**/*.es6.js',
		],
		...bitrix24Testing,
	},
];
