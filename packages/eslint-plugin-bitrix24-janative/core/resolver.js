import path from 'node:path';

import { BITRIX_DIR, COMPONENT_FILE, COMPONENTS_DIR, EXTENSION_FILE, EXTENSIONS_DIR, JS_EXTENSION } from './constants.js';
import { declaredDefinePaths, defineIndexFor } from './define-index.js';
import { isFile, readTextFile } from './fs-utils.js';
import { layoutForFile, layoutForRepo } from './layout.js';
import { dependencyTypeOf, depsPathToDefinePath, toDepsPath } from './path-utils.js';

/**
 * Resolves a define path to the file that declares it.
 *
 * Layout convention answers about four requests out of five and costs a few stat calls,
 * so it is tried first; the `jn.define()` index is built only when convention misses.
 */
export class Resolver
{
	#layout;

	#cache = new Map();

	constructor(layout)
	{
		this.#layout = layout;
	}

	get layout()
	{
		return this.#layout;
	}

	/**
	 * @returns {{definePath: string, file: string, type: string, depsPath: string}|null}
	 */
	resolve(definePath)
	{
		return this.#lookup(definePath).resolved;
	}

	/**
	 * A file sitting exactly where the path points, but declaring itself under another name.
	 * The request cannot work as written, and the declaration says how it should be written.
	 *
	 * @returns {{file: string, declared: string[]}|null}
	 */
	nearMiss(definePath)
	{
		return this.#lookup(definePath).nearMiss;
	}

	#lookup(definePath)
	{
		const normalized = depsPathToDefinePath(definePath);
		if (normalized === '')
		{
			return { resolved: null, nearMiss: null };
		}

		const cached = this.#cache.get(normalized);
		if (cached !== undefined)
		{
			return cached;
		}

		const record = this.#find(normalized);
		this.#cache.set(normalized, record);

		return record;
	}

	#find(definePath)
	{
		let nearMiss = null;

		for (const candidate of this.#candidates(definePath))
		{
			if (!isFile(candidate))
			{
				continue;
			}

			const declared = declaredPathsOf(candidate);
			if (declared.length === 0 || declared.includes(definePath))
			{
				return { resolved: describe(definePath, candidate), nearMiss: null };
			}

			nearMiss = nearMiss ?? { file: candidate, declared };
		}

		const indexed = defineIndexFor(this.#layout).resolve(definePath);
		if (indexed !== null)
		{
			return { resolved: describe(definePath, indexed), nearMiss: null };
		}

		return { resolved: null, nearMiss };
	}

	*#candidates(definePath)
	{
		const [head, ...rest] = definePath.split('/');
		const variants = [];

		if (this.#layout.hasNamespace(head) && rest.length > 0)
		{
			variants.push([head, rest.join('/')]);
		}
		variants.push([BITRIX_DIR, definePath]);

		for (const [namespace, tail] of variants)
		{
			for (const appRoot of this.#layout.appRootsForNamespace(namespace))
			{
				yield `${appRoot}/${EXTENSIONS_DIR}/${namespace}/${tail}/${EXTENSION_FILE}`;
				yield `${appRoot}/${COMPONENTS_DIR}/${namespace}/${tail}/${COMPONENT_FILE}`;
				yield `${appRoot}/${EXTENSIONS_DIR}/${namespace}/${tail}${JS_EXTENSION}`;
				yield `${appRoot}/${COMPONENTS_DIR}/${namespace}/${tail}${JS_EXTENSION}`;
			}
		}
	}
}

function describe(definePath, file)
{
	return {
		definePath,
		file,
		type: dependencyTypeOf(file),
		depsPath: toDepsPath(definePath, file),
	};
}

/**
 * A file with no explicit `jn.define()` is addressed by its location, so an empty list
 * means the layout convention applies rather than that the file declares nothing usable.
 */
function declaredPathsOf(file)
{
	const source = readTextFile(file);

	return source === null ? [] : declaredDefinePaths(source);
}

const resolverCache = new Map();

export function resolverForRepo(repoRoot)
{
	const layout = layoutForRepo(repoRoot);
	let resolver = resolverCache.get(layout.repoRoot);

	if (resolver === undefined)
	{
		resolver = new Resolver(layout);
		resolverCache.set(layout.repoRoot, resolver);
	}

	return resolver;
}

/** Resolver for the repository owning the file, or null when the file is outside the layout. */
export function resolverForFile(filePath)
{
	const layout = layoutForFile(path.resolve(filePath));

	return layout === null ? null : resolverForRepo(layout.repoRoot);
}

export function resetResolverCache()
{
	resolverCache.clear();
}
