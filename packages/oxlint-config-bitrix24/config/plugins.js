import { fileURLToPath } from 'node:url';

const local = (relativePath) => fileURLToPath(new URL(relativePath, import.meta.url));

// Native oxlint plugins the preset uses.
export const plugins = ['eslint', 'unicorn', 'import', 'promise', 'vue', 'typescript', 'oxc'];

// JS plugins. Specifiers are absolute so the preset works from any config location.
export const jsPlugins = [
	{
		name: '@bitrix24/bitrix24-rules',
		specifier: fileURLToPath(import.meta.resolve('@bitrix24/eslint-plugin-bitrix24-rules')),
	},
	// Replacements of ESLint core rules that oxlint has no native version of.
	{ name: '@bitrix24/core', specifier: local('../plugins/core/index.js') },
	// Third-party rules bundled by scripts/build.mjs.
	{ name: '@stylistic', specifier: local('../dist/stylistic.js') },
	{ name: '@bitrix24/unicorn', specifier: local('../dist/unicorn.js') },
	{ name: '@bitrix24/vue', specifier: local('../dist/vue.js') },
];
