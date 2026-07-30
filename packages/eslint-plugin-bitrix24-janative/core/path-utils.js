import path from 'node:path';

import {
	BITRIX_DIR,
	COMPONENT_FILE,
	COMPONENTS_DIR,
	DEPENDENCY_TYPE,
	EXTENSION_FILE,
	EXTENSIONS_DIR,
	JS_EXTENSION,
	MOBILE_APP_DIR,
	MOBILE_APP_PARENTS,
	MODULE_SEPARATOR,
	NATIVE_PREFIX,
	RELATIVE_PREFIX,
} from './constants.js';

export function toPosix(filePath)
{
	return String(filePath).split(path.sep).join('/');
}

function segmentsOf(filePath)
{
	return toPosix(filePath).split('/');
}

/**
 * Index of the mobileapp segment. The last one wins so that a checkout directory
 * named `mobileapp` cannot be mistaken for the layout root.
 */
function mobileAppIndex(segments)
{
	return segments.lastIndexOf(MOBILE_APP_DIR);
}

export function isJaNativePath(filePath)
{
	return mobileAppIndex(segmentsOf(filePath)) !== -1;
}

/**
 * Splits a path inside the mobileapp layout.
 *
 * `{repo}/tasksmobile/install/mobileapp/tasksmobile/extensions/tasks/dashboard/extension.js`
 * → appRoot `.../mobileapp/tasksmobile`, kind `extensions`, namespace `tasks`,
 *   tail `dashboard/extension.js`.
 *
 * @returns {{appRoot: string, kind: string, namespace: string, tail: string[]}|null}
 */
export function splitJaNativePath(filePath)
{
	const segments = segmentsOf(filePath);
	const start = mobileAppIndex(segments);
	if (start === -1)
	{
		return null;
	}

	for (let i = start + 1; i < segments.length; i++)
	{
		if (segments[i] !== EXTENSIONS_DIR && segments[i] !== COMPONENTS_DIR)
		{
			continue;
		}

		return {
			appRoot: segments.slice(0, i).join('/'),
			kind: segments[i],
			namespace: segments[i + 1] ?? '',
			tail: segments.slice(i + 1),
		};
	}

	return null;
}

/**
 * Path relative to the namespace root, with the anonymous `bitrix` namespace dropped.
 * Mirrors `Path.getJaNativeRelativePath` of the PhpStorm plugin.
 */
export function jaNativeRelativePath(filePath)
{
	const split = splitJaNativePath(filePath);
	if (split === null)
	{
		return '';
	}

	const tail = split.namespace === BITRIX_DIR ? split.tail.slice(1) : split.tail;

	return tail.join('/');
}

/**
 * Define path a file would declare if it followed the layout convention.
 * 22% of the real files declare something else, so this is a hint, not a verdict.
 */
export function canonicalDefinePath(filePath)
{
	const relative = jaNativeRelativePath(filePath);

	for (const entryFile of [EXTENSION_FILE, COMPONENT_FILE])
	{
		if (relative === entryFile)
		{
			return '';
		}

		if (relative.endsWith(`/${entryFile}`))
		{
			return relative.slice(0, -(entryFile.length + 1));
		}
	}

	const stripped = relative.endsWith(JS_EXTENSION)
		? relative.slice(0, -JS_EXTENSION.length)
		: relative;

	return stripped.replace(/\/+$/, '');
}

/** Namespace directory the file belongs to; `bitrix` means the anonymous mobile core. */
export function namespaceOf(filePath)
{
	return splitJaNativePath(filePath)?.namespace ?? '';
}

/** Dependency section a file belongs to, decided by its file name. */
export function dependencyTypeOf(filePath)
{
	const name = segmentsOf(filePath).pop();

	if (name === EXTENSION_FILE)
	{
		return DEPENDENCY_TYPE.EXTENSIONS;
	}

	if (name === COMPONENT_FILE)
	{
		return DEPENDENCY_TYPE.COMPONENTS;
	}

	return DEPENDENCY_TYPE.BUNDLE;
}

/**
 * Repository root for a file inside the layout: the directory holding module directories.
 * Derived from `{repoRoot}/{module}/{install|dev}/mobileapp/...`.
 */
export function repoRootFor(filePath)
{
	const segments = segmentsOf(filePath);
	const start = mobileAppIndex(segments);
	if (start < 2 || !MOBILE_APP_PARENTS.includes(segments[start - 1]))
	{
		return null;
	}

	const root = segments.slice(0, start - 2).join('/');

	return root === '' ? '/' : root;
}

export function isNativePath(definePath)
{
	return String(definePath).startsWith(NATIVE_PREFIX);
}

export function isBundleDepsPath(depsPath)
{
	return String(depsPath).startsWith(RELATIVE_PREFIX);
}

/** `tasks:dashboard` → `tasks/dashboard`; a path without a separator is returned as is. */
export function depsPathToDefinePath(depsPath)
{
	return String(depsPath).replace(MODULE_SEPARATOR, '/');
}

/**
 * Entry to write into deps.php for a resolved extension or component.
 * Namespaced paths get a colon, the anonymous `bitrix` namespace stays bare.
 */
export function toDepsPath(definePath, filePath)
{
	if (definePath.includes(MODULE_SEPARATOR))
	{
		return definePath;
	}

	const namespace = namespaceOf(filePath);
	if (namespace === '' || namespace === BITRIX_DIR)
	{
		return definePath;
	}

	return definePath.replace('/', MODULE_SEPARATOR);
}

/** Entry to write into deps.php for a bundle file: `./path/inside/extension`. */
export function toBundleDepsPath(filePath, extensionRoot)
{
	const relative = toPosix(path.relative(extensionRoot, filePath));
	const stripped = relative.endsWith(JS_EXTENSION)
		? relative.slice(0, -JS_EXTENSION.length)
		: relative;

	return stripped.startsWith('..') ? stripped : RELATIVE_PREFIX + stripped;
}
