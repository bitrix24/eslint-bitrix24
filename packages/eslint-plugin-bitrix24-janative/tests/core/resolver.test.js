import assert from 'node:assert/strict';

import { defineIndexFor } from '../../core/define-index.js';
import { layoutForRepo } from '../../core/layout.js';
import { Resolver, resolverForFile } from '../../core/resolver.js';
import { SAMPLE_LAYOUT, createLayout, removeLayouts } from '../helpers/layout-fixture.js';

describe('Resolver', () => {
	let root;
	let resolver;

	before(() => {
		root = createLayout(SAMPLE_LAYOUT);
		resolver = new Resolver(layoutForRepo(root));
	});

	after(removeLayouts);

	it('resolves a core extension without building the index', () => {
		const resolved = resolver.resolve('layout/ui/buttons');

		assert.equal(
			resolved.file,
			`${root}/mobile/install/mobileapp/mobile/extensions/bitrix/layout/ui/buttons/extension.js`,
		);
		assert.equal(resolved.type, 'extensions');
		assert.equal(resolved.depsPath, 'layout/ui/buttons');
		assert.equal(defineIndexFor(layoutForRepo(root)).built, false);
	});

	it('resolves a namespaced extension and adds the separator', () => {
		const resolved = resolver.resolve('tasks/dashboard');

		assert.equal(resolved.type, 'extensions');
		assert.equal(resolved.depsPath, 'tasks:dashboard');
	});

	it('resolves a component', () => {
		const resolved = resolver.resolve('tasks/tasks.list');

		assert.equal(resolved.type, 'components');
		assert.equal(resolved.depsPath, 'tasks:tasks.list');
	});

	it('resolves an extension declared in a dev application', () => {
		const resolved = resolver.resolve('dev/qa');

		assert.equal(resolved.file, `${root}/mobile/dev/mobileapp/extensions/dev/qa/extension.js`);
		assert.equal(resolved.depsPath, 'dev:qa');
	});

	it('falls back to the index when the location does not imply the path', () => {
		const resolved = resolver.resolve('tasks/task/loader');

		assert.equal(
			resolved.file,
			`${root}/tasksmobile/install/mobileapp/tasksmobile/extensions/tasks/task/src/loader.js`,
		);
		assert.equal(resolved.type, 'bundle');
		assert.equal(defineIndexFor(layoutForRepo(root)).built, true);
	});

	it('accepts a deps path with a separator', () => {
		assert.equal(resolver.resolve('tasks:dashboard').definePath, 'tasks/dashboard');
	});

	it('returns null for an unresolvable path', () => {
		assert.equal(resolver.resolve('tasks/nowhere'), null);
	});

	it('returns null for an empty path', () => {
		assert.equal(resolver.resolve(''), null);
	});

	it('is shared between files of the same repository', () => {
		const first = resolverForFile(`${root}/tasksmobile/install/mobileapp/tasksmobile/extensions/tasks/task/extension.js`);
		const second = resolverForFile(`${root}/mobile/install/mobileapp/mobile/components/bitrix/dialog/component.js`);

		assert.equal(first, second);
	});

	it('is absent for a file outside the layout', () => {
		assert.equal(resolverForFile(`${root}/tasksmobile/install/js/entry.js`), null);
	});

	// Creates its own layout, which resets the caches the tests above rely on: keep it last.
	it('does not look outside the application root for a path climbing with ..', () => {
		const escaped = createLayout({
			...SAMPLE_LAYOUT,
			'mobile/secret/extension.js': 'module.exports = {};\n',
		});

		assert.equal(new Resolver(layoutForRepo(escaped)).resolve('../../../../../secret'), null);
	});
});
