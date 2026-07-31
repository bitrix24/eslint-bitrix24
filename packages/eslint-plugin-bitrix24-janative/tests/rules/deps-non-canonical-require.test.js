import rule from '../../rules/deps-non-canonical-require.js';
import { FILES, createRuleTester } from '../helpers/rule-tester.js';

createRuleTester().run('deps-non-canonical-require', rule, {
	valid: [
		{
			code: "const { Loc } = require('loc');",
			filename: FILES.task,
		},
		{
			code: "const { Dashboard } = require('tasks/dashboard');",
			filename: FILES.task,
		},
		{
			// Nothing to compare against.
			code: "const { Nothing } = require('nowhere/at/all');",
			filename: FILES.task,
		},
		{
			// Annotations are written the way deps.php spells them.
			code: '// @deps tasks:dashboard',
			filename: FILES.task,
		},
		{
			code: "const { Dashboard } = require('tasks:dashboard');",
			filename: FILES.outside,
		},
	],
	invalid: [
		{
			code: "const { Dashboard } = require('tasks:dashboard');",
			filename: FILES.task,
			output: "const { Dashboard } = require('tasks/dashboard');",
			errors: [{ messageId: 'nonCanonical', data: { path: 'tasks:dashboard', canonical: 'tasks/dashboard' } }],
		},
		{
			code: 'const { List } = require("tasks:tasks.list");',
			filename: FILES.task,
			output: 'const { List } = require("tasks/tasks.list");',
			errors: [{ messageId: 'nonCanonical' }],
		},
		{
			// The file sits at src/helper.js but declares itself without the src segment,
			// so the path fails as written and the declaration says how to write it.
			code: "const { helper } = require('tasks/dashboard/src/helper');",
			filename: FILES.task,
			output: "const { helper } = require('tasks/dashboard/helper');",
			errors: [
				{
					messageId: 'nonCanonical',
					data: { path: 'tasks/dashboard/src/helper', canonical: 'tasks/dashboard/helper' },
				},
			],
		},
	],
});
