import * as path from 'node:path';
import * as fs from 'node:fs';

const ALIASES_FILE_NAME = 'webpack.aliases.js';
const DEFAULT_ALLOWED_MODULES = ['main', 'ui'];

// The repository the plugin is installed into: the fallback when the linted file
// has no webpack.aliases.js above it.
const installRepoPath = import.meta.dirname.split('node_modules').at(0);
const installAliasesPath = path.join(installRepoPath, ALIASES_FILE_NAME);

// Directory -> nearest webpack.aliases.js above it (or null).
const aliasesPathByDir = new Map();

// webpack.aliases.js path -> { mtimeMs, modules }, re-read only when the file changes.
const modulesByAliasesPath = new Map();

function findAliasesPath(fromDir)
{
	const visited = [];
	let dir = fromDir;
	let found = null;

	while (dir)
	{
		if (aliasesPathByDir.has(dir))
		{
			found = aliasesPathByDir.get(dir);
			break;
		}

		visited.push(dir);
		const candidate = path.join(dir, ALIASES_FILE_NAME);
		if (fs.existsSync(candidate))
		{
			found = candidate;
			break;
		}

		const parent = path.dirname(dir);
		if (parent === dir)
		{
			break;
		}

		dir = parent;
	}

	for (const visitedDir of visited)
	{
		aliasesPathByDir.set(visitedDir, found);
	}

	return found;
}

function readAllowedModules(aliasesPath)
{
	let mtimeMs;
	try
	{
		mtimeMs = fs.statSync(aliasesPath).mtimeMs;
	}
	catch
	{
		return null;
	}

	const cached = modulesByAliasesPath.get(aliasesPath);
	if (cached && cached.mtimeMs === mtimeMs)
	{
		return cached.modules;
	}

	let modules = null;
	try
	{
		const content = fs.readFileSync(aliasesPath, 'utf-8');
		const match = content.match(/allowedModules\s*:\s*\[([^\]]*)\]/);
		if (match)
		{
			modules = match[1]
				.split(',')
				.map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
				.filter(Boolean);
		}
	}
	catch
	{
		// File not found or parse error
	}

	modulesByAliasesPath.set(aliasesPath, { mtimeMs, modules });

	return modules;
}

function resolveAliasesPath(context)
{
	const configured = context.settings?.bitrix24?.aliasesFile;
	if (typeof configured === 'string' && configured.length > 0)
	{
		return configured;
	}

	const filename = context.filename ?? context.getFilename();
	if (filename && path.isAbsolute(filename))
	{
		const nearest = findAliasesPath(path.dirname(filename));
		if (nearest)
		{
			return nearest;
		}
	}

	return installAliasesPath;
}

function getAllowedModules(context)
{
	const configModules = readAllowedModules(resolveAliasesPath(context));
	if (Array.isArray(configModules))
	{
		return new Set([...configModules, ...DEFAULT_ALLOWED_MODULES]);
	}

	return new Set(DEFAULT_ALLOWED_MODULES);
}

export default {
	meta: {
		type: 'problem',
		schema: [],
		fixable: null,
		messages: {},
	},
	create(context) {
		let allowedModules = null;

		return {
			ImportDeclaration(node) {
				const [moduleName] = String(node.source.value).split('.');
				if (String(moduleName).length <= 1)
				{
					return;
				}

				allowedModules ??= getAllowedModules(context);
				if (!allowedModules.has(moduleName))
				{
					context.report({
						node: node.source,
						message: `Add '${moduleName}' to webpack.aliases.js and resave webpack settings in PhpStorm Preferences`,
					});
				}
			},
		};
	},
};
