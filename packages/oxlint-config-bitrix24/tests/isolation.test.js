import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

// Runtime dependencies (including required peers) of an installed package, recursively.
function runtimeDependencies(dir, seen = new Map())
{
	const pkg = readJson(path.join(dir, 'package.json'));
	const optionalPeers = new Set(Object.entries(pkg.peerDependenciesMeta ?? {}).filter(([, meta]) => meta.optional).map(([name]) => name));
	const names = [
		...Object.keys(pkg.dependencies ?? {}),
		...Object.keys(pkg.peerDependencies ?? {}).filter((name) => !optionalPeers.has(name)),
	];

	for (const name of names)
	{
		if (seen.has(name))
		{
			continue;
		}

		seen.set(name, pkg.name);
		let depDir = path.join(dir, 'node_modules', name);
		if (!fs.existsSync(depDir))
		{
			depDir = path.join(packageDir, 'node_modules', name);
		}

		if (fs.existsSync(depDir))
		{
			runtimeDependencies(fs.realpathSync(depDir), seen);
		}
	}

	return seen;
}

describe('isolation', () => {
	it('does not depend on eslint at runtime', () => {
		const dependencies = runtimeDependencies(packageDir);
		const eslintPackages = [...dependencies.keys()].filter((name) => /^eslint($|-plugin-)|^@stylistic\//.test(name));
		assert.deepEqual(eslintPackages, [], `required by: ${eslintPackages.map((name) => dependencies.get(name)).join(', ')}`);
	});

	it('does not bundle eslint into dist', () => {
		for (const file of fs.readdirSync(path.join(packageDir, 'dist')))
		{
			const code = fs.readFileSync(path.join(packageDir, 'dist', file), 'utf8');
			assert.ok(!code.includes('node_modules/eslint/lib/'), `${file} bundles eslint`);
		}
	});
});
