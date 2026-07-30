import assert from 'node:assert/strict';

import { DefineIndex, declaredDefinePaths } from '../../core/define-index.js';
import { layoutForRepo } from '../../core/layout.js';
import { SAMPLE_LAYOUT, createLayout, define, removeLayouts } from '../helpers/layout-fixture.js';

describe('declaredDefinePaths', () => {
	it('reads every declaration of a file', () => {
		const source = `${define('tasks/task')}\n${define('tasks/task/secondary')}`;

		assert.deepEqual(declaredDefinePaths(source), ['tasks/task', 'tasks/task/secondary']);
	});

	it('accepts both quote styles', () => {
		assert.deepEqual(declaredDefinePaths('jn.define("tasks/task", () => {});'), ['tasks/task']);
	});

	it('ignores a call that is not jn.define', () => {
		assert.deepEqual(declaredDefinePaths("define('tasks/task');"), []);
	});

	it('returns nothing for a file without declarations', () => {
		assert.deepEqual(declaredDefinePaths('module.exports = {};'), []);
	});
});

describe('DefineIndex', () => {
	let root;
	let index;

	before(() => {
		root = createLayout(SAMPLE_LAYOUT);
		index = new DefineIndex(layoutForRepo(root));
	});

	after(removeLayouts);

	it('is built only on the first request', () => {
		assert.equal(index.built, false);
		index.resolve('tasks/task');
		assert.equal(index.built, true);
	});

	it('resolves a declared path', () => {
		assert.equal(
			index.resolve('tasks/dashboard'),
			`${root}/tasksmobile/install/mobileapp/tasksmobile/extensions/tasks/dashboard/extension.js`,
		);
	});

	it('resolves a path that the file location does not imply', () => {
		assert.equal(
			index.resolve('tasks/task/loader'),
			`${root}/tasksmobile/install/mobileapp/tasksmobile/extensions/tasks/task/src/loader.js`,
		);
	});

	it('resolves an entry point without an explicit declaration', () => {
		assert.equal(
			index.resolve('utils/object'),
			`${root}/mobile/install/mobileapp/mobile/extensions/bitrix/utils/object/extension.js`,
		);
	});

	it('resolves a component', () => {
		assert.equal(
			index.resolve('tasks/tasks.list'),
			`${root}/tasksmobile/install/mobileapp/tasksmobile/components/tasks/tasks.list/component.js`,
		);
	});

	it('returns null for an unknown path', () => {
		assert.equal(index.resolve('tasks/does-not-exist'), null);
	});

	it('does not index the location of a file that declares another path', () => {
		assert.equal(index.resolve('tasks/task/src/loader'), null);
	});
});
