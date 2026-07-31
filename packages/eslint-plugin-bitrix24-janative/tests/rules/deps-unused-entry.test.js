import fs from 'node:fs';

import rule from '../../rules/deps-unused-entry.js';
import { FILES, createRuleTester } from '../helpers/rule-tester.js';

const read = file => fs.readFileSync(file, 'utf8');

createRuleTester().run('deps-unused-entry', rule, {
	valid: [
		{
			// Every entry of this extension is used.
			code: read(FILES.task),
			filename: FILES.task,
		},
		{
			code: read(FILES.dashboard),
			filename: FILES.dashboard,
		},
		{
			// The verdict belongs to the extension, so it is not repeated for every file.
			code: read(FILES.dashboardHelper),
			filename: FILES.dashboardHelper,
		},
		{
			code: "const { Nothing } = require('nowhere');",
			filename: FILES.outside,
		},
	],
	invalid: [
		{
			// 'type' is listed and unused; 'rest' is marked @keep and 'require-lazy' is
			// what requireLazy() comes from, so neither of them is reported.
			code: read(FILES.reports),
			filename: FILES.reports,
			errors: [{ messageId: 'unused', data: { depsPath: 'type' } }],
		},
	],
});
