import path from 'node:path';

import { BITRIX_DIR, COMPONENT_FILE, COMPONENTS_DIR, EXTENSION_FILE, EXTENSIONS_DIR, JS_EXTENSION } from './constants.js';
import { declaredPathsOf, defineIndexFor } from './define-index.js';
import { isFile } from './fs-utils.js';
import { layoutForFile, layoutForRepo } from './layout.js';
import { dependencyTypeOf, depsPathToDefinePath, toDepsPath, toPosix } from './path-utils.js';

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

		// A full miss is the one answer new files change, so it is the one answer
		// a long-lived ESLint server must not remember forever.
		if (record.resolved !== null || record.nearMiss !== null)
		{
			this.#cache.set(normalized, record);
		}

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
				return { resolved: describe(definePath, candidate, declared), nearMiss: null };
			}

			nearMiss = nearMiss ?? { file: candidate, declared };
		}

		const indexed = defineIndexFor(this.#layout).resolve(definePath);
		if (indexed !== null)
		{
			return { resolved: describe(definePath, indexed, declaredPathsOf(indexed)), nearMiss: null };
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
			const suffixes = [
				`${EXTENSIONS_DIR}/${namespace}/${tail}/${EXTENSION_FILE}`,
				`${COMPONENTS_DIR}/${namespace}/${tail}/${COMPONENT_FILE}`,
				`${EXTENSIONS_DIR}/${namespace}/${tail}${JS_EXTENSION}`,
				`${COMPONENTS_DIR}/${namespace}/${tail}${JS_EXTENSION}`,
			];

			for (const appRoot of this.#layout.appRootsForNamespace(namespace))
			{
				for (const suffix of suffixes)
				{
					// A requested path may carry `..`: what it points at outside the
					// application root is none of the resolver's business.
					const candidate = toPosix(path.resolve(appRoot, suffix));
					if (candidate.startsWith(`${appRoot}/`))
					{
						yield candidate;
					}
				}
			}
		}
	}
}

function describe(definePath, file, declared)
{
	return {
		definePath,
		file,
		declared,
		type: dependencyTypeOf(file),
		depsPath: toDepsPath(definePath, file),
	};
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
