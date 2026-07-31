import assert from 'node:assert/strict';

import {
	canonicalDefinePath,
	dependencyTypeOf,
	depsPathToDefinePath,
	isBundleDepsPath,
	isJaNativePath,
	isNativePath,
	jaNativeRelativePath,
	namespaceOf,
	repoRootFor,
	splitJaNativePath,
	toBundleDepsPath,
	toDepsPath,
} from '../../core/path-utils.js';

const TASKS_EXTENSION = '/repo/tasksmobile/install/mobileapp/tasksmobile/extensions/tasks/dashboard/extension.js';
const CORE_EXTENSION = '/repo/mobile/install/mobileapp/mobile/extensions/bitrix/layout/ui/buttons/extension.js';
const CORE_COMPONENT = '/repo/mobile/install/mobileapp/mobile/components/bitrix/dialog/component.js';
const DEV_EXTENSION = '/repo/mobile/dev/mobileapp/extensions/dev/qa/extension.js';
const BUNDLE = '/repo/tasksmobile/install/mobileapp/tasksmobile/extensions/tasks/task/src/loader.js';

describe('path-utils', () => {
	describe('isJaNativePath', () => {
		it('accepts paths inside the mobileapp tree', () => {
			assert.equal(isJaNativePath(TASKS_EXTENSION), true);
			assert.equal(isJaNativePath(DEV_EXTENSION), true);
		});

		it('rejects paths outside it', () => {
			assert.equal(isJaNativePath('/repo/tasks/install/js/tasks/entry.js'), false);
		});
	});

	describe('splitJaNativePath', () => {
		it('splits an application layout', () => {
			assert.deepEqual(splitJaNativePath(TASKS_EXTENSION), {
				appRoot: '/repo/tasksmobile/install/mobileapp/tasksmobile',
				kind: 'extensions',
				namespace: 'tasks',
				tail: ['tasks', 'dashboard', 'extension.js'],
			});
		});

		it('splits a dev layout without an application directory', () => {
			const split = splitJaNativePath(DEV_EXTENSION);
			assert.equal(split.appRoot, '/repo/mobile/dev/mobileapp');
			assert.equal(split.namespace, 'dev');
		});

		it('returns null outside the layout', () => {
			assert.equal(splitJaNativePath('/repo/tasks/install/js/entry.js'), null);
		});

		it('ignores a mobileapp segment above the layout root', () => {
			const split = splitJaNativePath('/checkout/mobileapp/mobile/install/mobileapp/mobile/extensions/bitrix/loc/extension.js');
			assert.equal(split.appRoot, '/checkout/mobileapp/mobile/install/mobileapp/mobile');
		});
	});

	describe('jaNativeRelativePath', () => {
		it('drops the anonymous bitrix namespace', () => {
			assert.equal(jaNativeRelativePath(CORE_EXTENSION), 'layout/ui/buttons/extension.js');
		});

		it('keeps a named namespace', () => {
			assert.equal(jaNativeRelativePath(TASKS_EXTENSION), 'tasks/dashboard/extension.js');
		});
	});

	describe('canonicalDefinePath', () => {
		it('strips the extension entry file', () => {
			assert.equal(canonicalDefinePath(CORE_EXTENSION), 'layout/ui/buttons');
		});

		it('strips the component entry file', () => {
			assert.equal(canonicalDefinePath(CORE_COMPONENT), 'dialog');
		});

		it('strips the js suffix of a bundle file', () => {
			assert.equal(canonicalDefinePath(BUNDLE), 'tasks/task/src/loader');
		});

		it('is empty outside the layout', () => {
			assert.equal(canonicalDefinePath('/repo/tasks/install/js/entry.js'), '');
		});
	});

	describe('namespaceOf', () => {
		it('reads the directory after extensions or components', () => {
			assert.equal(namespaceOf(TASKS_EXTENSION), 'tasks');
			assert.equal(namespaceOf(CORE_COMPONENT), 'bitrix');
			assert.equal(namespaceOf(DEV_EXTENSION), 'dev');
		});
	});

	describe('dependencyTypeOf', () => {
		it('decides by file name', () => {
			assert.equal(dependencyTypeOf(TASKS_EXTENSION), 'extensions');
			assert.equal(dependencyTypeOf(CORE_COMPONENT), 'components');
			assert.equal(dependencyTypeOf(BUNDLE), 'bundle');
		});
	});

	describe('repoRootFor', () => {
		it('handles the install layout', () => {
			assert.equal(repoRootFor(TASKS_EXTENSION), '/repo');
		});

		it('handles the dev layout', () => {
			assert.equal(repoRootFor(DEV_EXTENSION), '/repo');
		});

		it('returns null when mobileapp has an unexpected parent', () => {
			assert.equal(repoRootFor('/repo/mobileapp/extensions/bitrix/loc/extension.js'), null);
		});
	});

	describe('toDepsPath', () => {
		it('adds a separator for a named namespace', () => {
			assert.equal(toDepsPath('tasks/dashboard', TASKS_EXTENSION), 'tasks:dashboard');
		});

		it('keeps a core path bare', () => {
			assert.equal(toDepsPath('layout/ui/buttons', CORE_EXTENSION), 'layout/ui/buttons');
		});

		it('does not touch a path that already has a separator', () => {
			assert.equal(toDepsPath('tasks:dashboard', TASKS_EXTENSION), 'tasks:dashboard');
		});

		it('replaces only the first separator', () => {
			assert.equal(
				toDepsPath('tasks/statemanager/redux/types', TASKS_EXTENSION),
				'tasks:statemanager/redux/types',
			);
		});
	});

	describe('toBundleDepsPath', () => {
		it('builds a path relative to the extension root', () => {
			const root = '/repo/tasksmobile/install/mobileapp/tasksmobile/extensions/tasks/task';
			assert.equal(toBundleDepsPath(BUNDLE, root), './src/loader');
		});

		it('keeps an outward path recognisable', () => {
			const root = '/repo/tasksmobile/install/mobileapp/tasksmobile/extensions/tasks/dashboard';
			assert.equal(toBundleDepsPath(BUNDLE, root), '../task/src/loader');
		});
	});

	describe('deps path helpers', () => {
		it('converts a deps path back to a define path', () => {
			assert.equal(depsPathToDefinePath('tasks:statemanager/redux/types'), 'tasks/statemanager/redux/types');
			assert.equal(depsPathToDefinePath('layout/ui/buttons'), 'layout/ui/buttons');
		});

		it('recognises bundle and native paths', () => {
			assert.equal(isBundleDepsPath('./src/loader'), true);
			assert.equal(isBundleDepsPath('tasks:task'), false);
			assert.equal(isNativePath('native/analytics'), true);
			assert.equal(isNativePath('analytics'), false);
		});
	});
});
