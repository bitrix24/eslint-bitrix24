import fs from 'node:fs';
import path from 'node:path';

import { additionsOf, auditExtension } from '../core/audit.js';
import { extensionForRoot } from '../core/extension.js';
import { resolverForRepo } from '../core/resolver.js';
import { toPosix } from '../core/path-utils.js';
import { collectTargets } from './targets.js';

const USAGE = `Usage: janative-deps <check|sync> [path...] [options]

  check   report dependencies that do not match deps.php
  sync    write deps.php to match the code

Options:
  --dry-run   with sync, report the changes without writing them
  --quiet     report only the summary
  -h, --help  show this message

Paths default to the current directory. Errors -- an unresolved path, a bundle file of
another extension, a dependency missing from deps.php -- make check exit with 1.
Warnings -- an unused entry -- do not.
`;

const MODES = new Set(['check', 'sync']);

export function parseArguments(argv)
{
	const options = { mode: null, paths: [], dryRun: false, quiet: false, help: false };

	for (const argument of argv)
	{
		if (argument === '-h' || argument === '--help')
		{
			options.help = true;
		}
		else if (argument === '--dry-run')
		{
			options.dryRun = true;
		}
		else if (argument === '--quiet')
		{
			options.quiet = true;
		}
		else if (options.mode === null && MODES.has(argument))
		{
			options.mode = argument;
		}
		else if (argument.startsWith('-'))
		{
			return { ...options, error: `Unknown option: ${argument}` };
		}
		else
		{
			options.paths.push(argument);
		}
	}

	return options;
}

/**
 * @param {string[]} argv
 * @param {{log: Function, error: Function, cwd: string}} io
 * @returns {number} process exit code
 */
export function run(argv, { log = console.log, error = console.error, cwd = process.cwd() } = {})
{
	const options = parseArguments(argv);

	if (options.error !== undefined)
	{
		error(options.error);
		error(USAGE);

		return 2;
	}

	if (options.help)
	{
		log(USAGE);

		return 0;
	}

	if (options.mode === null)
	{
		error(USAGE);

		return 2;
	}

	const inputs = options.paths.length > 0 ? options.paths : [cwd];
	const { repoRoot, roots, outside } = collectTargets(inputs);

	for (const missed of outside)
	{
		error(`Not part of a mobileapp layout, skipped: ${missed}`);
	}

	if (repoRoot === null || roots.length === 0)
	{
		error('No JaNative extensions found.');

		return outside.length > 0 ? 2 : 0;
	}

	const resolver = resolverForRepo(repoRoot);
	const report = options.mode === 'check'
		? checkAll(roots, resolver, repoRoot, { log, quiet: options.quiet })
		: syncAll(roots, resolver, repoRoot, { log, quiet: options.quiet, dryRun: options.dryRun });

	log(report.summary);

	return report.exitCode;
}

function checkAll(roots, resolver, repoRoot, { log, quiet })
{
	let errors = 0;

	for (const root of roots)
	{
		const audit = auditExtension(extensionForRoot(root), resolver);
		const unreadable = audit.depsFile.exists && !audit.depsFile.parsed;
		// Every finding is an error, matching the preset: all five rules are `error` there,
		// so a commit the rules would fail must not slip through the command either.
		const lines = [
			...(unreadable ? ['  error  deps.php returns no array'] : []),
			...audit.unresolved.map(item => `  error  cannot find '${item.path}'`),
			...audit.nonCanonical.map(item => `  error  '${item.path}' should be written as '${item.canonical}'`),
			...audit.externalBundles.map(item => `  error  '${item.path}' is a bundle file of another extension`),
			...audit.missing.map(item => `  error  '${item.depsPath}' is missing from deps.php`),
			...audit.unused.map(entry => `  error  '${entry}' is listed in deps.php but unused`),
			...audit.duplicates.map(entry => `  error  '${entry}' is listed more than once in deps.php`),
		];

		errors += lines.length;

		if (lines.length > 0 && !quiet)
		{
			log(relative(repoRoot, root));
			lines.forEach(line => log(line));
		}
	}

	return {
		exitCode: errors > 0 ? 1 : 0,
		summary: `${roots.length} extensions checked, ${errors} errors`,
	};
}

function syncAll(roots, resolver, repoRoot, { log, quiet, dryRun })
{
	let written = 0;
	let removed = 0;
	let added = 0;
	let dropped = 0;
	let failed = 0;
	let skipped = 0;

	for (const root of roots)
	{
		const audit = auditExtension(extensionForRoot(root), resolver);
		const additions = additionsOf(audit);
		const removals = audit.unused;

		if (Object.keys(additions).length === 0 && removals.length === 0
			&& audit.duplicates.length === 0)
		{
			continue;
		}

		if (audit.depsFile.exists && !audit.depsFile.parsed)
		{
			skipped += 1;
			log(`${relative(repoRoot, root)}\n  ! deps.php returns no array, left untouched`);
			continue;
		}

		const result = audit.depsFile.apply({ add: additions, remove: removals });
		const target = audit.depsFile.path;

		added += Object.values(additions).flat().length;
		dropped += removals.length + audit.duplicates.length;

		if (!quiet)
		{
			log(relative(repoRoot, root));
			for (const [section, values] of Object.entries(additions))
			{
				values.forEach(value => log(`  + ${section}: ${value}`));
			}
			removals.forEach(value => log(`  - ${value}`));
			audit.duplicates.forEach(value => log(`  - ${value} (listed more than once)`));
			if (result === null)
			{
				log('  - deps.php (nothing left to list)');
			}
		}

		if (dryRun)
		{
			continue;
		}

		// Writing through a symlink would land outside the tree the command was pointed at.
		if (isSymbolicLink(target))
		{
			failed += 1;
			log(`  ! cannot write ${target}: refusing to follow symlink`);
			continue;
		}

		try
		{
			if (result === null)
			{
				fs.rmSync(target, { force: true });
				removed += 1;
			}
			else
			{
				fs.writeFileSync(target, result, 'utf8');
				written += 1;
			}
		}
		catch (writeError)
		{
			failed += 1;
			log(`  ! cannot write ${target}: ${writeError.message}`);
		}
	}

	const action = dryRun ? 'would change' : 'changed';
	const files = dryRun ? '' : `, ${written} files written, ${removed} removed`;
	const untouched = skipped > 0 ? `, ${skipped} left untouched` : '';

	return {
		exitCode: failed > 0 ? 1 : 0,
		summary: `${roots.length} extensions visited, ${action} ${added} additions and ${dropped} removals${files}${untouched}`,
	};
}

function isSymbolicLink(target)
{
	try
	{
		return fs.lstatSync(target).isSymbolicLink();
	}
	catch
	{
		return false;
	}
}

function relative(repoRoot, target)
{
	return toPosix(path.relative(repoRoot, target)) || '.';
}
