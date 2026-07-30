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

/** Every `.js` file under the directory, as absolute posix paths. */
export function* walkJsFiles(directory)
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
			yield* walkJsFiles(full);
		}
		else if (entry.isFile() && entry.name.endsWith(JS_EXTENSION))
		{
			yield full;
		}
	}
}
