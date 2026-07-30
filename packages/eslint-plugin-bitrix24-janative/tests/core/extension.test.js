import assert from 'node:assert/strict';

import { Extension, findExtensionRoot, requestedPaths } from '../../core/extension.js';
import { createLayout, define, removeLayouts } from '../helpers/layout-fixture.js';

const APP = 'tasksmobile/install/mobileapp/tasksmobile';
const TASK = `${APP}/extensions/tasks/task`;

const LAYOUT = {
	[`${TASK}/extension.js`]: [
		define('tasks/task'),
		"const { Loader } = require('tasks/task/loader');",
		"const { Loc } = require('loc');",
		'// @deps tasks:task/legacy',
		'requireLazy(\'tasks/task/heavy\');',
	].join('\n'),
	[`${TASK}/src/loader.js`]: `${define('tasks/task/loader')}\nconst { Type } = require('type');\n`,
	[`${TASK}/deps.php`]: "<?php\n\nreturn [\n\t'extensions' => [\n\t\t'loc',\n\t],\n];\n",
	// A bundle file may be called component.js; inside an extensions tree it marks nothing.
	[`${TASK}/widget/component.js`]: define('tasks/task/widget'),
	[`${TASK}/nested/extension.js`]: `${define('tasks/task/nested')}\nconst { Rest } = require('rest');\n`,
	[`${TASK}/nested/src/helper.js`]: "const { Http } = require('http');\n",
	[`${APP}/extensions/tasks/dashboard/extension.js`]: define('tasks/dashboard'),
};

describe('requestedPaths', () => {
	it('reads a require call with a string literal', () => {
		assert.deepEqual([...requestedPaths("const { Loc } = require('loc');")], ['loc']);
	});

	it('reads an annotation', () => {
		assert.deepEqual([...requestedPaths('// @deps tasks:task/legacy')], ['tasks:task/legacy']);
	});

	it('reads the global form used outside a define', () => {
		assert.deepEqual([...requestedPaths("jn.require('loc');")], ['loc']);
	});

	it('reads a call split across lines with a trailing comma', () => {
		assert.deepEqual([...requestedPaths("require(\n\t'loc',\n);")], ['loc']);
	});

	it('ignores a template string, which is what @deps is for', () => {
		assert.deepEqual([...requestedPaths('require(`${name}`);')], []);
	});

	it('ignores a require spelled inside a template string', () => {
		assert.deepEqual([...requestedPaths('const code = `require(\'loc\')`;')], []);
	});

	it('ignores an annotation spelled inside a string', () => {
		assert.deepEqual([...requestedPaths("const text = '@deps tasks:task/legacy';")], []);
	});

	it('leaves a method of somebody else alone', () => {
		assert.deepEqual([...requestedPaths("loader.require('loc');")], []);
	});

	it('falls back to a text scan when the source does not parse', () => {
		assert.deepEqual([...requestedPaths("require('loc'); this is not javascript {")], ['loc']);
	});

	it('does not repeat a path asked for twice', () => {
		assert.deepEqual([...requestedPaths("require('loc'); require('loc');")], ['loc']);
	});
});

describe('findExtensionRoot', () => {
	let root;

	before(() => {
		root = createLayout(LAYOUT);
	});

	after(removeLayouts);

	it('walks up to the nearest marker', () => {
		assert.equal(findExtensionRoot(`${root}/${TASK}/src/loader.js`), `${root}/${TASK}`);
	});

	it('stops at the nested extension, not at its parent', () => {
		assert.equal(
			findExtensionRoot(`${root}/${TASK}/nested/src/helper.js`),
			`${root}/${TASK}/nested`,
		);
	});

	it('does not take a bundle file named component.js for a root', () => {
		assert.equal(
			findExtensionRoot(`${root}/${TASK}/widget/component.js`),
			`${root}/${TASK}`,
		);
	});

	it('recognises a directory as a starting point', () => {
		assert.equal(findExtensionRoot(`${root}/${TASK}/src`), `${root}/${TASK}`);
	});

	it('gives up outside the layout', () => {
		assert.equal(findExtensionRoot(`${root}/tasksmobile/install/js/entry.js`), null);
	});
});

describe('Extension', () => {
	let root;
	let extension;

	before(() => {
		root = createLayout(LAYOUT);
		extension = Extension.forFile(`${root}/${TASK}/src/loader.js`);
	});

	after(removeLayouts);

	it('knows its entry point and its deps file', () => {
		assert.equal(extension.entryFile, `${root}/${TASK}/extension.js`);
		assert.equal(extension.depsFile.exists, true);
		assert.deepEqual([...extension.depsFile.values], ['loc']);
	});

	it('owns its files and leaves the nested extension alone', () => {
		const files = extension.files.map(file => file.slice(root.length + 1)).sort();

		assert.deepEqual(files, [
			`${TASK}/extension.js`,
			`${TASK}/src/loader.js`,
			`${TASK}/widget/component.js`,
		]);
	});

	it('collects dependencies of every own file', () => {
		const requested = [...extension.dependencies.paths.keys()].sort();

		assert.deepEqual(requested, ['loc', 'tasks/task/loader', 'tasks:task/legacy', 'type']);
	});

	it('remembers which file asked for a path', () => {
		assert.deepEqual(extension.dependencies.paths.get('type'), [`${root}/${TASK}/src/loader.js`]);
	});

	it('does not collect a lazily loaded path', () => {
		assert.equal(extension.dependencies.paths.has('tasks/task/heavy'), false);
	});

	it('notices that lazy loading is in use', () => {
		assert.equal(extension.dependencies.usesLazyLoading, true);
	});

	it('reports no lazy loading when there is none', () => {
		const other = Extension.forFile(`${root}/${APP}/extensions/tasks/dashboard/extension.js`);

		assert.equal(other.dependencies.usesLazyLoading, false);
	});

	it('is shared between files of the same extension', () => {
		assert.equal(extension, Extension.forFile(`${root}/${TASK}/extension.js`));
	});

	it('is absent for a file outside the layout', () => {
		assert.equal(Extension.forFile(`${root}/tasksmobile/install/js/entry.js`), null);
	});
});
