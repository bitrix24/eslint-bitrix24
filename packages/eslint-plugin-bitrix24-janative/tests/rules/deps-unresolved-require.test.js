import rule from '../../rules/deps-unresolved-require.js';
import { FILES, createRuleTester } from '../helpers/rule-tester.js';

createRuleTester().run('deps-unresolved-require', rule, {
	valid: [
		{
			code: "const { Loc } = require('loc');",
			filename: FILES.dashboard,
		},
		{
			code: "const { Type } = require('type');",
			filename: FILES.dashboard,
		},
		{
			// A native module lives outside the project and is never looked for.
			code: "const { Analytics } = require('native/analytics');",
			filename: FILES.dashboard,
		},
		{
			// Lazy loading is not a dependency of the file.
			code: "requireLazy('nowhere/at/all');",
			filename: FILES.dashboard,
		},
		{
			code: "jn.import('nowhere/at/all');",
			filename: FILES.dashboard,
		},
		{
			// A template string cannot be read; @deps exists for exactly this case.
			code: 'const name = "loc"; require(`${name}`);',
			filename: FILES.dashboard,
		},
		{
			// Outside the mobileapp layout no dependency rule applies.
			code: "const { Nothing } = require('nowhere/at/all');",
			filename: FILES.outside,
		},
		{
			code: '// @deps loc',
			filename: FILES.dashboard,
		},
		{
			// A file does sit there, it just declares another name: that is a spelling
			// problem with its own rule, not a missing extension.
			code: "const { helper } = require('tasks/dashboard/src/helper');",
			filename: FILES.task,
		},
	],
	invalid: [
		{
			code: "const { Nothing } = require('nowhere/at/all');",
			filename: FILES.dashboard,
			errors: [{ messageId: 'unresolved', data: { path: 'nowhere/at/all' } }],
		},
		{
			code: '// @deps tasks:nowhere',
			filename: FILES.dashboard,
			errors: [{ messageId: 'unresolved', data: { path: 'tasks:nowhere' } }],
		},
	],
});
