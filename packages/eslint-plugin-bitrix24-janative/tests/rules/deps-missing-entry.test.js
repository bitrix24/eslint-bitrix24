import rule from '../../rules/deps-missing-entry.js';
import { FILES, createRuleTester } from '../helpers/rule-tester.js';

createRuleTester().run('deps-missing-entry', rule, {
	valid: [
		{
			code: "const { Loc } = require('loc');",
			filename: FILES.dashboard,
		},
		{
			// Listed in deps.php of the extension, required from one of its own files.
			code: "const { Loc } = require('loc');",
			filename: FILES.dashboardHelper,
		},
		{
			code: "const { inner } = require('tasks/task/inner');",
			filename: FILES.task,
		},
		{
			code: '// @deps loc',
			filename: FILES.dashboard,
		},
		{
			code: "const { Analytics } = require('native/analytics');",
			filename: FILES.dashboard,
		},
		{
			// An unresolved path and a bundle of another extension get their own verdicts,
			// so this rule stays quiet about them.
			code: "const { Nothing } = require('nowhere/at/all');",
			filename: FILES.dashboard,
		},
		{
			code: "const { inner } = require('tasks/task/inner');",
			filename: FILES.dashboard,
		},
		{
			code: "requireLazy('type');",
			filename: FILES.dashboard,
		},
	],
	invalid: [
		{
			code: "const { Type } = require('type');",
			filename: FILES.dashboard,
			errors: [{ messageId: 'missing', data: { depsPath: 'type' } }],
		},
		{
			code: "const { Task } = require('tasks/task');",
			filename: FILES.dashboard,
			errors: [{ messageId: 'missing', data: { depsPath: 'tasks:task' } }],
		},
		{
			code: "const { List } = require('tasks/tasks.list');",
			filename: FILES.dashboard,
			errors: [{ messageId: 'missing', data: { depsPath: 'tasks:tasks.list' } }],
		},
		{
			// An own bundle file must be listed as a relative path.
			code: "const { helper } = require('tasks/dashboard/helper');",
			filename: FILES.dashboard,
			errors: [{ messageId: 'missing', data: { depsPath: './src/helper' } }],
		},
		{
			code: '// @deps type',
			filename: FILES.dashboard,
			errors: [{ messageId: 'missing', data: { depsPath: 'type' } }],
		},
	],
});
