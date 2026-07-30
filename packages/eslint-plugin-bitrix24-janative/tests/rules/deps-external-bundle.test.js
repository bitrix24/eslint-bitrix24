import rule from '../../rules/deps-external-bundle.js';
import { FILES, createRuleTester } from '../helpers/rule-tester.js';

createRuleTester().run('deps-external-bundle', rule, {
	valid: [
		{
			// A bundle file of the same extension is fine.
			code: "const { helper } = require('tasks/dashboard/helper');",
			filename: FILES.dashboard,
		},
		{
			// So is an extension of another module.
			code: "const { Loc } = require('loc');",
			filename: FILES.dashboard,
		},
		{
			// An unresolved path is somebody else's verdict.
			code: "const { Nothing } = require('nowhere/at/all');",
			filename: FILES.dashboard,
		},
		{
			code: "const { inner } = require('tasks/task/inner');",
			filename: FILES.outside,
		},
	],
	invalid: [
		{
			code: "const { inner } = require('tasks/task/inner');",
			filename: FILES.dashboard,
			errors: [{ messageId: 'external', data: { path: 'tasks/task/inner' } }],
		},
		{
			code: '// @deps tasks/task/inner',
			filename: FILES.dashboard,
			errors: [{ messageId: 'external' }],
		},
	],
});
