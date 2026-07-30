import { DEPENDENCY_TYPE, MODULE_SEPARATOR, RELATIVE_PREFIX } from './constants.js';
import { declaredDefinePaths } from './define-index.js';
import { findExtensionRoot } from './extension.js';
import { readTextFile } from './fs-utils.js';
import { canonicalDefinePath, isNativePath, toBundleDepsPath } from './path-utils.js';

/** The extension providing `requireLazy()`: used through the function, never through `require()`. */
export const LAZY_LOADING_EXTENSION = 'require-lazy';

export const REQUEST = {
	NATIVE: 'native',
	SELF: 'self',
	UNRESOLVED: 'unresolved',
	NON_CANONICAL: 'non-canonical',
	EXTERNAL_BUNDLE: 'external-bundle',
	MISSING_ENTRY: 'missing-entry',
	LISTED: 'listed',
};

/**
 * Verdict on a single requested path.
 *
 * The checks form a chain — an unresolved path says nothing about deps.php — so a request
 * has exactly one verdict and the rules built on top report one message, not three.
 *
 * `canonical` is filled whenever the path works but is spelled differently from the name the
 * target file declares — a separate observation from the verdict itself.
 *
 * @returns {{kind: string, resolved: Object|null, depsPath: string|null, canonical: string|null}}
 */
export function classifyRequest({ extension, resolver }, requestedPath)
{
	if (isNativePath(requestedPath))
	{
		return verdict(REQUEST.NATIVE);
	}

	const resolved = resolver.resolve(requestedPath);
	if (resolved === null)
	{
		const nearMiss = resolver.nearMiss(requestedPath);

		return nearMiss === null
			? verdict(REQUEST.UNRESOLVED)
			: verdict(REQUEST.NON_CANONICAL, { canonical: nearMiss.declared[0] });
	}

	// A file reaching for the name of the extension it lives in — the global form makes this
	// spelling natural. Nothing depends on itself, so there is nothing to list.
	if (resolved.file === extension.entryFile)
	{
		return verdict(REQUEST.SELF, { resolved });
	}

	const canonical = spellingOf(resolved, requestedPath);

	if (resolved.type === DEPENDENCY_TYPE.BUNDLE)
	{
		const file = findExtensionRoot(resolved.file) === extension.root
			? resolved.file
			: ownDeclarationOf(extension, requestedPath);

		if (file === null)
		{
			return verdict(REQUEST.EXTERNAL_BUNDLE, { resolved, canonical });
		}

		const depsPath = toBundleDepsPath(file, extension.root);

		return verdict(verdictFor(extension, depsPath), { resolved, depsPath, canonical });
	}

	return verdict(verdictFor(extension, resolved.depsPath), {
		resolved,
		depsPath: resolved.depsPath,
		canonical,
	});
}

/**
 * A file of the extension itself declaring the requested name.
 *
 * Two files in the repository may declare the same name. The one the extension carries is
 * the one it bundles, so it wins over a namesake living in another module.
 */
function ownDeclarationOf(extension, definePath)
{
	for (const file of extension.files)
	{
		const source = readTextFile(file);

		if (source !== null && declaredDefinePaths(source).includes(definePath))
		{
			return file;
		}
	}

	return null;
}

function verdict(kind, { resolved = null, depsPath = null, canonical = null } = {})
{
	return { kind, resolved, depsPath, canonical };
}

function spellingOf(resolved, requestedPath)
{
	const canonical = canonicalRequirePath(resolved);

	return canonical !== '' && canonical !== requestedPath ? canonical : null;
}

function verdictFor(extension, depsPath)
{
	return listsPath(extension, depsPath) ? REQUEST.LISTED : REQUEST.MISSING_ENTRY;
}

/** deps.php may spell a namespaced path with either separator; both mean the same entry. */
export function listsPath(extension, depsPath)
{
	const deps = extension.depsFile;

	return deps.has(depsPath) || deps.has(alternativeSpelling(depsPath));
}

function alternativeSpelling(depsPath)
{
	return depsPath.includes(MODULE_SEPARATOR)
		? depsPath.replace(MODULE_SEPARATOR, '/')
		: depsPath.replace('/', MODULE_SEPARATOR);
}

/**
 * The path a `require()` call should spell to reach the file it resolved to.
 * A file declares its own name, so the declaration wins over the file location.
 */
export function canonicalRequirePath(resolved)
{
	const source = readTextFile(resolved.file);
	const declared = source === null ? [] : declaredDefinePaths(source);

	if (declared.length === 0)
	{
		return canonicalDefinePath(resolved.file);
	}

	return declared.includes(resolved.definePath) ? resolved.definePath : declared[0];
}

/**
 * Everything wrong with one extension: what it asks for and cannot get, and what its
 * `deps.php` claims it needs but nothing uses.
 *
 * The unit of judgement is the extension, not the file: a path unused by one file may
 * well be used by its neighbour.
 */
export function auditExtension(extension, resolver, { overrides = null } = {})
{
	const context = { extension, resolver };
	const { paths, usesLazyLoading } = overrides === null
		? extension.dependencies
		: extension.collectDependencies(overrides);

	const unresolved = [];
	const nonCanonical = [];
	const externalBundles = [];
	const missing = [];
	const required = new Map();

	// A request the audit cannot follow through — a native module, a path that resolves
	// nowhere, a bundle file of a neighbour — still keeps its deps.php entry alive: the code
	// does ask for it. What is wrong with the request itself is reported by its own rule, and
	// calling the entry unused on top of that would have `sync` delete a line the build needs.
	const protectEntry = requestedPath => required.set(requestedPath, { type: null, path: requestedPath });

	// deps.php may point at the very same file by a relative path — a second spelling of the
	// request, not an entry of its own.
	const protectFileSpelling = (file) => {
		const relative = toBundleDepsPath(file, extension.root);

		protectEntry(relative);
		protectEntry(relative.startsWith(RELATIVE_PREFIX) ? relative : RELATIVE_PREFIX + relative);
	};

	for (const [requestedPath, sources] of paths)
	{
		const request = classifyRequest(context, requestedPath);

		if (request.kind === REQUEST.SELF)
		{
			continue;
		}

		if (request.kind === REQUEST.NATIVE)
		{
			protectEntry(requestedPath);
			continue;
		}

		if (request.canonical !== null)
		{
			nonCanonical.push({ path: requestedPath, canonical: request.canonical, sources });
		}

		if (request.kind === REQUEST.UNRESOLVED)
		{
			unresolved.push({ path: requestedPath, sources });
			protectEntry(requestedPath);
			continue;
		}

		if (request.kind === REQUEST.NON_CANONICAL)
		{
			protectEntry(requestedPath);
			continue;
		}

		if (request.kind === REQUEST.EXTERNAL_BUNDLE)
		{
			externalBundles.push({ path: requestedPath, sources, file: request.resolved.file });
			protectEntry(requestedPath);
			protectFileSpelling(request.resolved.file);
			continue;
		}

		required.set(request.depsPath, { type: request.resolved.type, path: requestedPath });
		protectFileSpelling(request.resolved.file);

		if (request.kind === REQUEST.MISSING_ENTRY)
		{
			missing.push({
				depsPath: request.depsPath,
				type: request.resolved.type,
				path: requestedPath,
				sources,
			});
		}
	}

	// The extension providing lazy loading is used through requireLazy(), not through require(),
	// so it is protected from removal but never added: nothing in the code points at it, and
	// guessing that it belongs here would be adding a dependency nobody asked for.
	if (usesLazyLoading)
	{
		required.set(LAZY_LOADING_EXTENSION, { type: DEPENDENCY_TYPE.EXTENSIONS, path: null });
	}

	const deps = extension.depsFile;
	const kept = deps.kept;
	const unused = deps.entries
		.map(entry => entry.value)
		.filter(value => !kept.has(value))
		.filter(value => !required.has(value) && !required.has(alternativeSpelling(value)));

	return {
		root: extension.root,
		depsFile: deps,
		usesLazyLoading,
		unresolved,
		nonCanonical,
		externalBundles,
		missing,
		unused,
		required,
	};
}

/** Missing entries grouped into the sections `deps.php` writes them to. */
export function additionsOf(audit)
{
	const additions = {};

	for (const entry of audit.missing)
	{
		additions[entry.type] = additions[entry.type] ?? [];
		if (!additions[entry.type].includes(entry.depsPath))
		{
			additions[entry.type].push(entry.depsPath);
		}
	}

	return additions;
}
