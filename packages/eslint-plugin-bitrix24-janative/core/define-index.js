import { COMPONENT_FILE, COMPONENTS_DIR, EXTENSION_FILE, EXTENSIONS_DIR } from './constants.js';
import { readTextFile, walkJsFiles } from './fs-utils.js';
import { canonicalDefinePath } from './path-utils.js';

const DEFINE_PATTERN = /jn\.define\(\s*(['"])([^'"]+)\1/g;

/** Every define path declared by a file. */
export function declaredDefinePaths(source)
{
	const paths = [];

	DEFINE_PATTERN.lastIndex = 0;
	let match = DEFINE_PATTERN.exec(source);
	while (match !== null)
	{
		paths.push(match[2]);
		match = DEFINE_PATTERN.exec(source);
	}

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

	get size()
	{
		if (this.#map === null)
		{
			this.#build();
		}

		return this.#map.size;
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

					for (const definePath of declaredDefinePaths(source))
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
}
