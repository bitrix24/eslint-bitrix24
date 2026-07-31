import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resetDefineIndexCache } from '../../core/define-index.js';
import { resetExtensionCache } from '../../core/extension.js';
import { resetLayoutCache } from '../../core/layout.js';
import { resetResolverCache } from '../../core/resolver.js';

const created = [];

/**
 * Writes a temporary mobileapp layout.
 *
 * @param {Object<string, string>} files repo-relative path -> file contents
 * @returns {string} repository root
 */
export function createLayout(files)
{
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'janative-layout-'));
	created.push(root);

	for (const [relative, contents] of Object.entries(files))
	{
		const full = path.join(root, relative);
		fs.mkdirSync(path.dirname(full), { recursive: true });
		fs.writeFileSync(full, contents, 'utf8');
	}

	resetCaches();

	return root;
}

export function resetCaches()
{
	resetLayoutCache();
	resetDefineIndexCache();
	resetResolverCache();
	resetExtensionCache();
}

export function removeLayouts()
{
	while (created.length > 0)
	{
		fs.rmSync(created.pop(), { recursive: true, force: true });
	}

	resetCaches();
}

export function define(definePath, body = '')
{
	return `jn.define('${definePath}', () => {\n${body}\n});\n`;
}

/** Layout used by most of the core tests: two applications, a dev application, a bundle file. */
export const SAMPLE_LAYOUT = {
	'mobile/install/mobileapp/mobile/extensions/bitrix/layout/ui/buttons/extension.js':
		define('layout/ui/buttons'),
	'mobile/install/mobileapp/mobile/extensions/bitrix/utils/object/extension.js':
		'module.exports = {};\n',
	'mobile/install/mobileapp/mobile/components/bitrix/dialog/component.js':
		define('dialog'),
	'mobile/dev/mobileapp/extensions/dev/qa/extension.js':
		define('dev/qa'),
	'tasksmobile/install/mobileapp/tasksmobile/extensions/tasks/dashboard/extension.js':
		define('tasks/dashboard'),
	'tasksmobile/install/mobileapp/tasksmobile/extensions/tasks/task/extension.js':
		define('tasks/task'),
	'tasksmobile/install/mobileapp/tasksmobile/extensions/tasks/task/src/loader.js':
		define('tasks/task/loader'),
	'tasksmobile/install/mobileapp/tasksmobile/components/tasks/tasks.list/component.js':
		define('tasks/tasks.list'),
};
