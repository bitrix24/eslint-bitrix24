import { COMPONENT_FILE, COMPONENTS_DIR, EXTENSION_FILE, EXTENSIONS_DIR } from './constants.js';
import { modifiedAt, readTextFile, walkJsFiles } from './fs-utils.js';
import { canonicalDefinePath } from './path-utils.js';

const DEFINE_PATTERN = /jn\.define\(\s*(['"])([^'"]+)\1/g;

/** Every define path declared by a file. */
export function declaredDefinePaths(source)
{
	return [...source.matchAll(DEFINE_PATTERN)].map(match => match[2]);
}

const declaredCache = new Map();

/**
 * Declared paths of a file on disk, re-read only when the file changes. The resolver asks
 * this about the same candidate files over and over - once per requiring extension.
 */
export function declaredPathsOf(file)
{
	const stamp = modifiedAt(file);
	const cached = declaredCache.get(file);
	if (cached !== undefined && cached.stamp === stamp)
	{
		return cached.paths;
	}

	const source = stamp === null ? null : readTextFile(file);
	const paths = source === null ? [] : declaredDefinePaths(source);
	declaredCache.set(file, { stamp, paths });

	return paths;
}

/**
 * Index of `jn.define()` declarations across the layout.
 *
 * Define paths are declared, not derived: about a fifth of the files in the repository
 * declare something other than what their location implies. The index is the only
 * reliable way to resolve those, so it is built lazily and kept in memory only.
 */
export class DefineIndex
{
	#layout;

	#map = null;

	constructor(layout)
	{
		this.#layout = layout;
	}

	get built()
	{
		return this.#map !== null;
	}

	/** File declaring the define path, or null when nothing declares it. */
	resolve(definePath)
	{
		if (this.#map === null)
		{
			this.#build();
		}

		return this.#map.get(definePath) ?? null;
	}

	#build()
	{
		this.#map = new Map();

		const entryFiles = [];

		for (const appRoot of this.#layout.appRoots)
		{
			for (const kind of [EXTENSIONS_DIR, COMPONENTS_DIR])
			{
				for (const file of walkJsFiles(`${appRoot}/${kind}`))
				{
					const source = readTextFile(file);
					if (source === null)
					{
						continue;
					}

					const declared = declaredDefinePaths(source);
					declaredCache.set(file, { stamp: modifiedAt(file), paths: declared });

					for (const definePath of declared)
					{
						if (!this.#map.has(definePath))
						{
							this.#map.set(definePath, file);
						}
					}

					if (file.endsWith(`/${EXTENSION_FILE}`) || file.endsWith(`/${COMPONENT_FILE}`))
					{
						entryFiles.push(file);
					}
				}
			}
		}

		// Entry points without an explicit `jn.define()` are addressed by their location.
		for (const file of entryFiles)
		{
			const definePath = canonicalDefinePath(file);
			if (definePath !== '' && !this.#map.has(definePath))
			{
				this.#map.set(definePath, file);
			}
		}
	}
}

const indexCache = new Map();

export function defineIndexFor(layout)
{
	let index = indexCache.get(layout.repoRoot);

	if (index === undefined)
	{
		index = new DefineIndex(layout);
		indexCache.set(layout.repoRoot, index);
	}

	return index;
}

export function resetDefineIndexCache()
{
	indexCache.clear();
	declaredCache.clear();
}
