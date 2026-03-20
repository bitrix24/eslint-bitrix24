import { RuleTester } from 'eslint';
import rule from '../rules/prefer-inline-type-imports.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const ruleTester = new RuleTester({
	parser: require.resolve('@babel/eslint-parser'),
	parserOptions: {
		ecmaVersion: 2015,
		sourceType: 'module',
		requireConfigFile: false,
		babelOptions: {
			parserOpts: {
				plugins: ['flow']
			}
		}
	}
});

ruleTester.run('prefer-inline-type-imports', rule, {
	valid: [
		{
			code: `import { type Store } from 'ui.vue3.vuex';`
		},
		{
			code: `import { Type, type JsonObject } from 'main.core';`
		},
		{
			code: `
import { Helper } from './helper';
import { type Config } from './config';
`
		},
		{
			code: `
import { Type } from 'main.core';
import { External } from 'calendar.sliderloader';
`
		},
		{
			code: `
import { A } from 'main.core';
import type Default from 'main.core';
`
		},
		{
			code: `
import { A } from 'main.core';
import type Default, { T } from 'main.core';
`
		},
		{
			code: `
import D from 'main.core';
import type Default from 'main.core';
`
		},
		{
			code: `import type Default from 'main.core';`
		}
	],

	invalid: [
		{
			code: `
import type { Store } from 'ui.vue3.vuex';
`,
			output: `
import { type Store } from 'ui.vue3.vuex';
`,
			errors: [
				{
					message: /Use inline type syntax/
				}
			]
		},
		{
			code: `
import type { User, Role } from 'main.core';
`,
			output: `
import { type User, type Role } from 'main.core';
`,
			errors: [
				{
					message: /Use inline type syntax/
				}
			]
		},
		{
			code: `
import { Type } from 'main.core';

import type { JsonObject } from 'main.core';
`,
			output: `
import { Type, type JsonObject } from 'main.core';
`,
			errors: [
				{
					message: /Use inline type syntax/
				}
			]
		},

		{
			code: `
import { Helper } from './helper';
import type { Config } from './helper';
`,
			output: `
import { Helper, type Config } from './helper';
`,
			errors: [
				{
					message: /Use inline type syntax/
				}
			]
		},
		{
			code: `
import { A, } from 'main.core';
import type { T } from 'main.core';
`,
			output: `
import { A, type T } from 'main.core';
`,
			errors: [
				{
					message: /Use inline type syntax/
				}
			]
		},
		{
			code: `
import D from 'main.core';
import type { T } from 'main.core';
`,
			output: `
import D, { type T } from 'main.core';
`,
			errors: [
				{
					message: /Use inline type syntax/
				}
			]
		},
		{
			code: `
import Foo, * as ns from 'main.core';
import type { T } from 'main.core';
`,
			output: `
import Foo, * as ns from 'main.core';
import { type T } from 'main.core';
`,
			errors: [
				{
					message: /Use inline type syntax/
				}
			]
		},
		{
			code: `
import { MemoryCache } from 'main.core.cache';
import { type BaseCache } from 'main.core.cache';
`,
			output: `
import { MemoryCache, type BaseCache } from 'main.core.cache';
`,
			errors: [
				{
					message: /Use inline type syntax/
				}
			]
		}
	]
});

console.log('All tests passed!');
