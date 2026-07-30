import fs from 'node:fs';
import path from 'node:path';

import { COMPONENT_FILE, COMPONENTS_DIR, DEPS_FILE, EXTENSION_FILE, JS_EXTENSION } from './constants.js';
import { DepsFile } from './deps-file.js';
import { isFile, readTextFile } from './fs-utils.js';
import { splitJaNativePath, toPosix } from './path-utils.js';
import { scanSource } from './source-scan.js';

export { DEPS_ANNOTATION_PATTERN, LAZY_PATTERN, REQUIRE_PATTERN } from './source-scan.js';

/** Entry point of a tree: `extension.js` under extensions, `component.js` under components. */
function entryMarkerFor(directory)
{
	return splitJaNativePath(directory)?.kind === COMPONENTS_DIR ? COMPONENT_FILE : EXTENSION_FILE;
}

function isDirectory(candidate)
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

/** A directory owning an extension: it carries the entry point of its tree, or a deps.php. */
export function isExtensionRoot(directory)
{
	return isFile(`${directory}/${entryMarkerFor(directory)}`) || isFile(`${directory}/${DEPS_FILE}`);
}

function modifiedAt(filePath)
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

/**
 * Nearest directory upwards holding `extension.js`, `component.js` or `deps.php`.
 * The search never leaves the namespace it started in.
 */
export function findExtensionRoot(startPath)
{
	const absolute = toPosix(path.resolve(startPath));
	let current = isDirectory(absolute) ? absolute : toPosix(path.dirname(absolute));

	while (true)
	{
		const split = splitJaNativePath(current);
		if (split === null || split.tail.length < 2)
		{
			return null;
		}

		if (isExtensionRoot(current))
		{
			return current;
		}

		current = toPosix(path.dirname(current));
	}
}

/**
 * An extension or component as a whole: its own files and everything they depend on.
 *
 * A verdict about an unused entry cannot be reached from a single file — the path may well
 * be used by a sibling — so the unit of judgement is the extension, not the file.
 */
export class Extension
{
	#root;

	#scans = new Map();

	#depsFile = null;

	#depsStamp = null;

	constructor(root)
	{
		this.#root = toPosix(root);
	}

	static forFile(filePath)
	{
		const root = findExtensionRoot(filePath);

		return root === null ? null : extensionForRoot(root);
	}

	get root()
	{
		return this.#root;
	}

	/** `extension.js` or `component.js` of the extension, or null when it has neither. */
	get entryFile()
	{
		for (const marker of [EXTENSION_FILE, COMPONENT_FILE])
		{
			const candidate = `${this.#root}/${marker}`;
			if (isFile(candidate))
			{
				return candidate;
			}
		}

		return null;
	}

	get depsPath()
	{
		return `${this.#root}/${DEPS_FILE}`;
	}

	/** Parsed `deps.php`, re-read whenever the file on disk changes. */
	get depsFile()
	{
		const stamp = modifiedAt(this.depsPath);

		if (this.#depsFile === null || this.#depsStamp !== stamp)
		{
			this.#depsFile = DepsFile.read(this.depsPath);
			this.#depsStamp = stamp;
		}

		return this.#depsFile;
	}

	/**
	 * JS files owned by the extension: nested extensions are somebody else's business.
	 * Listed anew on every call, so a file created after the first look is not missed —
	 * an ESLint server lives long, and a directory listing is cheap next to reading files.
	 */
	get files()
	{
		return [...collectOwnFiles(this.#root)];
	}

	/**
	 * @returns {{paths: Map<string, string[]>, usesLazyLoading: boolean}}
	 *          `paths` maps a requested define path to the files asking for it
	 */
	get dependencies()
	{
		return this.collectDependencies();
	}

	/**
	 * @param {Map<string, string>|null} overrides contents to use instead of what is on disk,
	 *        so that a file open in the editor is judged by what it says now
	 */
	collectDependencies(overrides = null)
	{
		const paths = new Map();
		let usesLazyLoading = false;

		for (const file of this.files)
		{
			const override = overrides?.get(file);
			const scan = override === undefined ? this.#scanOf(file) : scanSource(override);
			if (scan === null)
			{
				continue;
			}

			for (const requested of scan.paths)
			{
				const sources = paths.get(requested) ?? [];
				if (!sources.includes(file))
				{
					sources.push(file);
				}
				paths.set(requested, sources);
			}

			usesLazyLoading = usesLazyLoading || scan.usesLazyLoading;
		}

		return { paths, usesLazyLoading };
	}

	/** Scan of one file, re-read only when the file on disk changes. */
	#scanOf(file)
	{
		const stamp = modifiedAt(file);
		const cached = this.#scans.get(file);

		if (cached !== undefined && cached.stamp === stamp)
		{
			return cached.scan;
		}

		const source = readTextFile(file);
		const scan = source === null ? null : scanSource(source);
		this.#scans.set(file, { stamp, scan });

		return scan;
	}
}

/** Define paths a source asks for, through `require()` or an `@deps` annotation. */
export function requestedPaths(source)
{
	return scanSource(source).paths;
}

function* collectOwnFiles(root)
{
	let entries;

	try
	{
		entries = fs.readdirSync(root, { withFileTypes: true });
	}
	catch
	{
		return;
	}

	for (const entry of entries)
	{
		const full = `${root}/${entry.name}`;

		if (entry.isDirectory())
		{
			if (!isExtensionRoot(full))
			{
				yield* collectOwnFiles(full);
			}
		}
		else if (entry.isFile() && entry.name.endsWith(JS_EXTENSION))
		{
			yield full;
		}
	}
}

const extensionCache = new Map();

export function extensionForRoot(root)
{
	const key = toPosix(path.resolve(root));
	let extension = extensionCache.get(key);

	if (extension === undefined)
	{
		extension = new Extension(key);
		extensionCache.set(key, extension);
	}

	return extension;
}

export function resetExtensionCache()
{
	extensionCache.clear();
}
