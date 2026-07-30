import fs from 'node:fs';

import { JS_EXTENSION } from './constants.js';
import { toPosix } from './path-utils.js';

export function isFile(candidate)
{
	try
	{
		return fs.statSync(candidate).isFile();
	}
	catch
	{
		return false;
	}
}

export function isDirectory(candidate)
{
	try
	{
		return fs.statSync(candidate).isDirectory();
	}
	catch
	{
		return false;
	}
}

/** Modification stamp of a file, or null when it does not exist. */
export function modifiedAt(filePath)
{
	try
	{
		return fs.statSync(filePath).mtimeMs;
	}
	catch
	{
		return null;
	}
}

/** Directories that are never part of the source tree. */
const NEVER_SOURCES = new Set(['node_modules', '.git', '.hg', '.idea']);

export function readTextFile(filePath)
{
	try
	{
		return fs.readFileSync(filePath, 'utf8');
	}
	catch
	{
		return null;
	}
}

/**
 * Every `.js` file under the directory, as absolute posix paths. Directories that are never
 * sources are skipped outright; `prune` skips subtrees the caller does not own.
 */
export function* walkJsFiles(directory, prune = null)
{
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
		const full = `${toPosix(directory)}/${entry.name}`;

		if (entry.isDirectory())
		{
			if (!NEVER_SOURCES.has(entry.name) && (prune === null || !prune(full)))
			{
				yield* walkJsFiles(full, prune);
			}
		}
		else if (entry.isFile() && entry.name.endsWith(JS_EXTENSION))
		{
			yield full;
		}
	}
}
