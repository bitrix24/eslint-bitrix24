import fs from 'node:fs';
import path from 'node:path';

import {
	BITRIX_DIR,
	COMPONENTS_DIR,
	EXTENSIONS_DIR,
	MOBILE_APP_DIR,
	MOBILE_APP_PARENTS,
} from './constants.js';
import { repoRootFor, toPosix } from './path-utils.js';

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

function readDirectories(parent)
{
	try
	{
		return fs.readdirSync(parent, { withFileTypes: true })
			.filter(entry => entry.isDirectory())
			.map(entry => entry.name);
	}
	catch
	{
		return [];
	}
}

/**
 * Layout of the mobileapp tree of a repository: application roots and the namespaces they own.
 *
 * An application root is a directory that directly holds `extensions` and/or `components`,
 * that is `{module}/install/mobileapp/{app}` or `{module}/dev/mobileapp`.
 */
export class Layout
{
	#repoRoot;

	#appRoots = null;

	#namespaces = null;

	#appRootsByNamespace = null;

	constructor(repoRoot)
	{
		this.#repoRoot = toPosix(repoRoot);
	}

	get repoRoot()
	{
		return this.#repoRoot;
	}

	/** Application roots, as absolute posix paths. */
	get appRoots()
	{
		if (this.#appRoots === null)
		{
			this.#scan();
		}

		return this.#appRoots;
	}

	/** Namespaces declared by the layout. The anonymous `bitrix` namespace is not included. */
	get namespaces()
	{
		if (this.#namespaces === null)
		{
			this.#scan();
		}

		return this.#namespaces;
	}

	hasNamespace(namespace)
	{
		return this.namespaces.has(namespace);
	}

	/** Application roots owning the namespace; `bitrix` resolves to every root that has it. */
	appRootsForNamespace(namespace)
	{
		if (this.#appRootsByNamespace === null)
		{
			this.#scan();
		}

		return this.#appRootsByNamespace.get(namespace) ?? [];
	}

	#scan()
	{
		this.#appRoots = [];
		this.#namespaces = new Set();
		this.#appRootsByNamespace = new Map();

		for (const moduleName of readDirectories(this.#repoRoot))
		{
			for (const parent of MOBILE_APP_PARENTS)
			{
				const mobileApp = `${this.#repoRoot}/${moduleName}/${parent}/${MOBILE_APP_DIR}`;
				if (!isDirectory(mobileApp))
				{
					continue;
				}

				this.#collectAppRoots(mobileApp);
			}
		}
	}

	#collectAppRoots(mobileApp)
	{
		const candidates = [mobileApp, ...readDirectories(mobileApp).map(name => `${mobileApp}/${name}`)];

		for (const candidate of candidates)
		{
			const kinds = [EXTENSIONS_DIR, COMPONENTS_DIR].filter(kind => isDirectory(`${candidate}/${kind}`));
			if (kinds.length === 0)
			{
				continue;
			}

			this.#appRoots.push(candidate);

			for (const kind of kinds)
			{
				for (const namespace of readDirectories(`${candidate}/${kind}`))
				{
					if (namespace !== BITRIX_DIR)
					{
						this.#namespaces.add(namespace);
					}

					const roots = this.#appRootsByNamespace.get(namespace) ?? [];
					if (!roots.includes(candidate))
					{
						roots.push(candidate);
					}
					this.#appRootsByNamespace.set(namespace, roots);
				}
			}
		}
	}
}

const layoutCache = new Map();

/** Layout for a repository root, cached for the lifetime of the process. */
export function layoutForRepo(repoRoot)
{
	const key = toPosix(path.resolve(repoRoot));
	let layout = layoutCache.get(key);

	if (layout === undefined)
	{
		layout = new Layout(key);
		layoutCache.set(key, layout);
	}

	return layout;
}

/** Layout owning a file inside the mobileapp tree, or null when the file is outside it. */
export function layoutForFile(filePath)
{
	const repoRoot = repoRootFor(path.resolve(filePath));

	return repoRoot === null ? null : layoutForRepo(repoRoot);
}

export function resetLayoutCache()
{
	layoutCache.clear();
}
