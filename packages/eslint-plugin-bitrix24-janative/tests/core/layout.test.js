import assert from 'node:assert/strict';

import { layoutForFile, layoutForRepo } from '../../core/layout.js';
import { SAMPLE_LAYOUT, createLayout, removeLayouts } from '../helpers/layout-fixture.js';

describe('Layout', () => {
	let root;

	before(() => {
		root = createLayout(SAMPLE_LAYOUT);
	});

	after(removeLayouts);

	it('finds every application root', () => {
		const roots = layoutForRepo(root).appRoots.map(appRoot => appRoot.slice(root.length + 1));

		assert.deepEqual(roots.sort(), [
			'mobile/dev/mobileapp',
			'mobile/install/mobileapp/mobile',
			'tasksmobile/install/mobileapp/tasksmobile',
		]);
	});

	it('collects named namespaces and omits the anonymous one', () => {
		const namespaces = [...layoutForRepo(root).namespaces].sort();

		assert.deepEqual(namespaces, ['dev', 'tasks']);
		assert.equal(layoutForRepo(root).hasNamespace('bitrix'), false);
	});

	it('maps a namespace to the applications owning it', () => {
		const layout = layoutForRepo(root);

		assert.deepEqual(
			layout.appRootsForNamespace('tasks'),
			[`${root}/tasksmobile/install/mobileapp/tasksmobile`],
		);
		assert.deepEqual(
			layout.appRootsForNamespace('bitrix'),
			[`${root}/mobile/install/mobileapp/mobile`],
		);
		assert.deepEqual(layout.appRootsForNamespace('unknown'), []);
	});

	it('is shared between files of the same repository', () => {
		const first = layoutForFile(`${root}/tasksmobile/install/mobileapp/tasksmobile/extensions/tasks/task/extension.js`);
		const second = layoutForFile(`${root}/mobile/install/mobileapp/mobile/components/bitrix/dialog/component.js`);

		assert.equal(first, second);
	});

	it('is absent for a file outside the layout', () => {
		assert.equal(layoutForFile(`${root}/tasksmobile/install/js/entry.js`), null);
	});
});
