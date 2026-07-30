import fs from 'node:fs';
import path from 'node:path';

import { COMPONENT_FILE, DEPS_FILE, EXTENSION_FILE, JS_EXTENSION } from './constants.js';
import { DepsFile } from './deps-file.js';
import { isFile, readTextFile } from './fs-utils.js';
import { splitJaNativePath, toPosix } from './path-utils.js';

const ROOT_MARKERS = [EXTENSION_FILE, COMPONENT_FILE, DEPS_FILE];

/** `require('path')` with a string literal; a template string is out of reach and needs `@deps`. */
export const REQUIRE_PATTERN = /(?<![.\w])require\(\s*(['"])([^'"]+)\1\s*\)/g;

/** `@deps path/to/extension` in a comment. */
export const DEPS_ANNOTATION_PATTERN = /@deps\s+(\S+)/g;

/** Lazy loading never goes into deps.php, but it tells that `require-lazy` is in use. */
export const LAZY_PATTERN = /(?<![.\w])requireLazy\(|(?<![.\w])jn\.import\(/;

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

function isExtensionRoot(directory)
{
	return ROOT_MARKERS.some(marker => isFile(`${directory}/${marker}`));
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

	#files = null;

	#dependencies = null;

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

	/** JS files owned by the extension: nested extensions are somebody else's business. */
	get files()
	{
		if (this.#files === null)
		{
			this.#files = [...collectOwnFiles(this.#root)];
		}

		return this.#files;
	}

	/**
	 * @returns {{paths: Map<string, string[]>, usesLazyLoading: boolean}}
	 *          `paths` maps a requested define path to the files asking for it
	 */
	get dependencies()
	{
		if (this.#dependencies === null)
		{
			this.#dependencies = this.collectDependencies();
		}

		return this.#dependencies;
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
			const source = overrides?.get(file) ?? readTextFile(file);
			if (source === null)
			{
				continue;
			}

			for (const requested of requestedPaths(source))
			{
				const sources = paths.get(requested) ?? [];
				if (!sources.includes(file))
				{
					sources.push(file);
				}
				paths.set(requested, sources);
			}

			usesLazyLoading = usesLazyLoading || LAZY_PATTERN.test(source);
		}

		return { paths, usesLazyLoading };
	}
}

/** Define paths a source asks for, through `require()` or an `@deps` annotation. */
export function requestedPaths(source)
{
	const found = new Set();

	for (const match of source.matchAll(REQUIRE_PATTERN))
	{
		found.add(match[2]);
	}

	for (const match of source.matchAll(DEPS_ANNOTATION_PATTERN))
	{
		found.add(match[1]);
	}

	return found;
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
