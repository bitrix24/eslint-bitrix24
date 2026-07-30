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
		const normalized = depsPathToDefinePath(definePath);
		if (normalized === '')
		{
			return null;
		}

		if (this.#cache.has(normalized))
		{
			return this.#cache.get(normalized);
		}

		const file = this.#findByConvention(normalized) ?? defineIndexFor(this.#layout).resolve(normalized);
		const resolved = file === null
			? null
			: {
				definePath: normalized,
				file,
				type: dependencyTypeOf(file),
				depsPath: toDepsPath(normalized, file),
			};

		this.#cache.set(normalized, resolved);

		return resolved;
	}

	#findByConvention(definePath)
	{
		for (const candidate of this.#candidates(definePath))
		{
			if (isFile(candidate) && declaresDefinePath(candidate, definePath))
			{
				return candidate;
			}
		}

		return null;
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

/**
 * A file found by convention counts only when it does not declare a different define path:
 * a file with no explicit `jn.define()` is addressed by its location.
 */
function declaresDefinePath(file, definePath)
{
	const source = readTextFile(file);
	if (source === null)
	{
		return false;
	}

	const declared = declaredDefinePaths(source);

	return declared.length === 0 || declared.includes(definePath);
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
