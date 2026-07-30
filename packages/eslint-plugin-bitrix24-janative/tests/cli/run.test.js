import assert from 'node:assert/strict';
import fs from 'node:fs';

import { run } from '../../cli/run.js';
import { SAMPLE_LAYOUT, createLayout, define, removeLayouts } from '../helpers/layout-fixture.js';

const APP = 'tasksmobile/install/mobileapp/tasksmobile';
const DASHBOARD = `${APP}/extensions/tasks/dashboard`;
const REPORTS = `${APP}/extensions/tasks/reports`;
const FLAT = `${APP}/extensions/tasks/flat`;
const BROKEN = `${APP}/extensions/tasks/broken`;
const PROTECTED = `${APP}/extensions/tasks/protected`;
const NAMESAKE = `${APP}/extensions/tasks/namesake`;
const DOUBLED = `${APP}/extensions/tasks/doubled`;

const LAYOUT = {
	...SAMPLE_LAYOUT,
	// Requires loc and its own bundle, lists neither.
	[`${DASHBOARD}/extension.js`]: [
		define('tasks/dashboard'),
		"const { Loc } = require('loc');",
		"const { helper } = require('tasks/dashboard/helper');",
	].join('\n'),
	[`${DASHBOARD}/src/helper.js`]: define('tasks/dashboard/helper'),
	[`${DASHBOARD}/deps.php`]: "<?php\n\nreturn [\n\t'extensions' => [\n\t\t'type',\n\t\t'utils/object', // @keep\n\t],\n];\n",
	// Uses lazy loading and lists an entry nothing needs.
	[`${REPORTS}/extension.js`]: `${define('tasks/reports')}\nrequireLazy('tasks/task');\n`,
	[`${REPORTS}/deps.php`]: "<?php\n\nreturn [\n\t'extensions' => [\n\t\t'require-lazy',\n\t\t'type',\n\t],\n];\n",
	// A flat file must stay flat.
	[`${FLAT}/extension.js`]: `${define('tasks/flat')}\nconst { Loc } = require('loc');\n`,
	[`${FLAT}/deps.php`]: "<?php\n\nreturn [\n\t'type',\n];\n",
	// A deps.php that returns nothing cannot be edited and must be left alone.
	[`${BROKEN}/extension.js`]: `${define('tasks/broken')}\nconst { Loc } = require('loc');\n`,
	[`${BROKEN}/deps.php`]: '<?php\n',
	// Entries the audit cannot follow: a native module and a bundle file of a neighbour.
	[`${PROTECTED}/extension.js`]: [
		define('tasks/protected'),
		"const { File } = require('native/filesystem');",
		"const { helper } = require('tasks/dashboard/helper');",
	].join('\n'),
	[`${PROTECTED}/deps.php`]:
		"<?php\n\nreturn [\n\t'extensions' => [\n\t\t'native/filesystem',\n\t\t'tasks:dashboard/helper',\n\t],\n\t'bundle' => [\n\t\t'./../dashboard/src/helper',\n\t],\n];\n",
	// Declares a name the mobile core declares too, and asks for it.
	[`${NAMESAKE}/extension.js`]: [
		define('tasks/namesake'),
		"const { Shared } = require('shared/thing');",
	].join('\n'),
	[`${NAMESAKE}/src/thing.js`]: define('shared/thing'),
	[`${NAMESAKE}/deps.php`]: "<?php\n\nreturn [\n\t'bundle' => [\n\t\t'./src/thing',\n\t],\n];\n",
	'mobile/install/mobileapp/mobile/extensions/bitrix/shared/thing.js': define('shared/thing'),
	// Lists the same dependency twice.
	[`${DOUBLED}/extension.js`]: `${define('tasks/doubled')}\nconst { Loc } = require('loc');\n`,
	[`${DOUBLED}/deps.php`]:
		"<?php\n\nreturn [\n\t'extensions' => [\n\t\t'loc',\n\t\t'loc',\n\t],\n];\n",
	'mobile/install/mobileapp/mobile/extensions/bitrix/loc/extension.js': define('loc'),
	'mobile/install/mobileapp/mobile/extensions/bitrix/type/extension.js': define('type'),
	'mobile/install/mobileapp/mobile/extensions/bitrix/require-lazy/extension.js': define('require-lazy'),
};

function capture(argv, root)
{
	const output = [];
	const errors = [];
	const exitCode = run(argv, {
		log: line => output.push(String(line)),
		error: line => errors.push(String(line)),
		cwd: root,
	});

	return { exitCode, output: output.join('\n'), errors: errors.join('\n') };
}

const read = file => fs.readFileSync(file, 'utf8');

describe('janative-deps', () => {
	describe('arguments', () => {
		let root;

		before(() => {
			root = createLayout(LAYOUT);
		});

		after(removeLayouts);

		it('explains itself when asked', () => {
			const result = capture(['--help'], root);

			assert.equal(result.exitCode, 0);
			assert.match(result.output, /Usage: janative-deps/);
		});

		it('refuses to guess when no mode is given', () => {
			assert.equal(capture([], root).exitCode, 2);
		});

		it('rejects an unknown option', () => {
			const result = capture(['check', '--nonsense'], root);

			assert.equal(result.exitCode, 2);
			assert.match(result.errors, /Unknown option/);
		});

		it('reports a path outside the layout', () => {
			const result = capture(['check', '/'], root);

			assert.notEqual(result.exitCode, 0);
		});
	});

	describe('check', () => {
		let root;

		before(() => {
			root = createLayout(LAYOUT);
		});

		after(removeLayouts);

		it('fails on a missing entry and names it', () => {
			const result = capture(['check', `${root}/${DASHBOARD}`], root);

			assert.equal(result.exitCode, 1);
			assert.match(result.output, /'loc' is missing from deps\.php/);
			assert.match(result.output, /'\.\/src\/helper' is missing from deps\.php/);
			assert.match(result.output, /'type' is listed in deps\.php but unused/);
		});

		it('does not call a protected entry unused', () => {
			const result = capture(['check', `${root}/${DASHBOARD}`], root);

			assert.equal(result.output.includes('utils/object'), false);
		});

		it('fails on an unused entry, matching the preset where the rule is an error', () => {
			const result = capture(['check', `${root}/${REPORTS}`], root);

			assert.equal(result.exitCode, 1);
			assert.match(result.output, /'type' is listed in deps\.php but unused/);
			// require-lazy is used through requireLazy(), so it is not unused.
			assert.equal(result.output.includes("'require-lazy' is listed"), false);
		});

		it('keeps an entry the code asks for, whatever is wrong with the request', () => {
			const result = capture(['check', `${root}/${PROTECTED}`], root);

			// The bundle file of a neighbour is a problem of its own, reported once.
			assert.match(result.output, /'tasks\/dashboard\/helper' is a bundle file of another extension/);
			assert.equal(result.output.includes('but unused'), false);
		});

		it('keeps an entry pointing at the same file by a relative path', () => {
			const result = capture(['check', `${root}/${PROTECTED}`], root);

			assert.equal(result.output.includes("'./../dashboard/src/helper' is listed"), false);
		});

		it('prefers its own declaration over a namesake in another module', () => {
			const result = capture(['check', `${root}/${NAMESAKE}`], root);

			assert.equal(result.exitCode, 0);
			assert.equal(result.output.includes('bundle file of another extension'), false);
			assert.equal(result.output.includes("'./src/thing' is listed"), false);
		});

		it('calls out a deps.php that returns no array', () => {
			const result = capture(['check', `${root}/${BROKEN}`], root);

			assert.equal(result.exitCode, 1);
			assert.match(result.output, /deps\.php returns no array/);
		});

		it('calls out an entry listed more than once', () => {
			const result = capture(['check', `${root}/${DOUBLED}`], root);

			assert.equal(result.exitCode, 1);
			assert.match(result.output, /'loc' is listed more than once in deps\.php/);
		});

		it('counts everything it visited', () => {
			const result = capture(['check', root], root);

			assert.match(result.output, /extensions checked, \d+ errors/);
		});

		it('says nothing but the summary when quiet', () => {
			const result = capture(['check', `${root}/${DASHBOARD}`, '--quiet'], root);

			assert.equal(result.exitCode, 1);
			assert.equal(result.output.includes('missing from deps.php'), false);
		});
	});

	describe('sync', () => {
		let root;

		before(() => {
			root = createLayout(LAYOUT);
		});

		after(removeLayouts);

		it('changes nothing on a dry run', () => {
			const before = read(`${root}/${DASHBOARD}/deps.php`);
			const result = capture(['sync', `${root}/${DASHBOARD}`, '--dry-run'], root);

			assert.equal(result.exitCode, 0);
			assert.equal(read(`${root}/${DASHBOARD}/deps.php`), before);
			assert.match(result.output, /would change/);
		});

		it('adds what is used and removes what is not, sparing @keep', () => {
			const result = capture(['sync', `${root}/${DASHBOARD}`], root);

			assert.equal(result.exitCode, 0);
			assert.equal(read(`${root}/${DASHBOARD}/deps.php`), `<?php

return [
	'extensions' => [
		'utils/object', // @keep
		'loc',
	],
	'bundle' => [
		'./src/helper',
	],
];
`);
		});

		it('is stable: a second run has nothing to do', () => {
			const after = read(`${root}/${DASHBOARD}/deps.php`);
			const result = capture(['sync', `${root}/${DASHBOARD}`], root);

			assert.equal(read(`${root}/${DASHBOARD}/deps.php`), after);
			assert.match(result.output, /0 additions and 0 removals/);
		});

		it('leaves a flat file flat', () => {
			capture(['sync', `${root}/${FLAT}`], root);

			assert.equal(read(`${root}/${FLAT}/deps.php`), "<?php\n\nreturn [\n\t'loc',\n];\n");
		});

		it('leaves a deps.php it cannot read exactly as it was', () => {
			const result = capture(['sync', `${root}/${BROKEN}`], root);

			assert.equal(read(`${root}/${BROKEN}/deps.php`), '<?php\n');
			assert.match(result.output, /left untouched/);
		});

		it('keeps the first listing of a doubled entry and drops the rest', () => {
			const result = capture(['sync', `${root}/${DOUBLED}`], root);

			assert.equal(result.exitCode, 0);
			assert.equal(
				read(`${root}/${DOUBLED}/deps.php`),
				"<?php\n\nreturn [\n\t'extensions' => [\n\t\t'loc',\n\t],\n];\n",
			);
		});

		it('removes a deps.php with nothing left to list', () => {
			capture(['sync', `${root}/${REPORTS}`], root);

			assert.equal(fs.existsSync(`${root}/${REPORTS}/deps.php`), true);
			assert.equal(read(`${root}/${REPORTS}/deps.php`).includes("'type'"), false);
		});
	});
});
