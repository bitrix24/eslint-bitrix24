import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { RuleTester } from 'oxlint/plugins-dev';
import rule from '../../rules/need-alias.js';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'need-alias-'));
const repo = path.join(root, 'repo');
const extensionDir = path.join(repo, 'crm', 'install', 'js', 'crm', 'entity', 'src');
fs.mkdirSync(extensionDir, { recursive: true });
fs.writeFileSync(
	path.join(repo, 'webpack.aliases.js'),
	"module.exports = { allowedModules: ['crm', 'im'] };\n",
);

const other = path.join(root, 'other');
fs.mkdirSync(other, { recursive: true });
const configuredAliases = path.join(other, 'aliases.js');
fs.writeFileSync(configuredAliases, "module.exports = { allowedModules: ['tasks'] };\n");

const fileInRepo = path.join(extensionDir, 'entity.js');
const message = (moduleName) => `Add '${moduleName}' to webpack.aliases.js and resave webpack settings in PhpStorm Preferences`;

new RuleTester().run('need-alias', rule, {
	valid: [
		{ code: "import { Loc } from 'main.core';", filename: fileInRepo },
		{ code: "import { Entity } from 'crm.entity';", filename: fileInRepo },
		{ code: "import { Chat } from 'im.v2.lib.chat';", filename: fileInRepo },
		{ code: "import { helper } from './helper';", filename: fileInRepo },
		{
			code: "import { Task } from 'tasks.task';",
			filename: fileInRepo,
			settings: { bitrix24: { aliasesFile: configuredAliases } },
		},
	],
	invalid: [
		{
			code: "import { Task } from 'tasks.task';",
			filename: fileInRepo,
			errors: [{ message: message('tasks') }],
		},
		{
			code: "import { Entity } from 'crm.entity';",
			filename: fileInRepo,
			settings: { bitrix24: { aliasesFile: configuredAliases } },
			errors: [{ message: message('crm') }],
		},
		{
			code: "import { Entity } from 'crm.entity';",
			filename: path.join(other, 'file.js'),
			errors: [{ message: message('crm') }],
		},
	],
});
