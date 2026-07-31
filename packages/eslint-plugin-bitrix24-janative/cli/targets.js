import fs from 'node:fs';
import path from 'node:path';

import { COMPONENTS_DIR, EXTENSIONS_DIR } from '../core/constants.js';
import { findExtensionRoot, isExtensionRoot } from '../core/extension.js';
import { isFile } from '../core/fs-utils.js';
import { layoutForRepo } from '../core/layout.js';
import { repoRootFor, toPosix } from '../core/path-utils.js';

const SKIPPED = new Set(['node_modules', '.git', '.hg', '.idea']);

function isInside(candidate, container)
{
	return candidate === container || candidate.startsWith(`${container}/`);
}

function* extensionRootsUnder(directory)
{
	if (isExtensionRoot(directory))
	{
		yield directory;
	}

	let entries;

	try
	{
		entries = fs.readdirSync(directory, { withFileTypes: true });
	}
	catch
	{
		return;
	}

	for (const entry of entries)
	{
		// A nested extension is an extension of its own, so the walk goes all the way down.
		if (entry.isDirectory() && !SKIPPED.has(entry.name))
		{
			yield* extensionRootsUnder(`${directory}/${entry.name}`);
		}
	}
}

/**
 * Repository a path belongs to. A path inside the layout answers by itself; anything else
 * (the repository root, a module directory) is answered by looking for a mobileapp tree
 * at or above it.
 */
export function findRepoRoot(startPath)
{
	const fromLayout = repoRootFor(startPath);
	if (fromLayout !== null)
	{
		return fromLayout;
	}

	let current = startPath;
	while (true)
	{
		if (layoutForRepo(current).appRoots.length > 0)
		{
			return current;
		}

		const parent = toPosix(path.dirname(current));
		if (parent === current)
		{
			return null;
		}

		current = parent;
	}
}

/**
 * Parts of the mobileapp tree the path covers.
 *
 * Walking the path itself would visit the whole repository (and any working copy nested
 * inside it), so the walk is confined to the extension and component directories the
 * layout knows about.
 */
function searchAreas(layout, absolute)
{
	const areas = [];

	for (const appRoot of layout.appRoots)
	{
		for (const kind of [EXTENSIONS_DIR, COMPONENTS_DIR])
		{
			const area = `${appRoot}/${kind}`;

			if (isInside(area, absolute))
			{
				areas.push(area);
			}
			else if (isInside(absolute, area))
			{
				areas.push(absolute);
			}
		}
	}

	return areas;
}

/**
 * Extension roots the command should visit, and the repository they belong to.
 *
 * @param {string[]} inputs files or directories
 * @returns {{repoRoot: string|null, roots: string[], outside: string[]}}
 */
export function collectTargets(inputs)
{
	const roots = new Set();
	const outside = [];
	let repoRoot = null;

	for (const input of inputs)
	{
		const absolute = toPosix(path.resolve(input));
		const owner = findRepoRoot(absolute);

		if (owner === null)
		{
			outside.push(absolute);
			continue;
		}

		repoRoot = repoRoot ?? owner;

		if (isFile(absolute))
		{
			const root = findExtensionRoot(absolute);
			if (root === null)
			{
				outside.push(absolute);
			}
			else
			{
				roots.add(root);
			}

			continue;
		}

		const areas = searchAreas(layoutForRepo(owner), absolute);
		if (areas.length === 0)
		{
			outside.push(absolute);
			continue;
		}

		for (const area of areas)
		{
			for (const root of extensionRootsUnder(area))
			{
				roots.add(root);
			}
		}
	}

	return { repoRoot, roots: [...roots].sort(), outside };
}
