import * as assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fixtureDir = path.join(packageDir, 'tests', 'fixtures', 'preset');

function lintFixture()
{
	const bin = path.join(path.dirname(require.resolve('oxlint/package.json')), 'bin', 'oxlint');
	const result = spawnSync(process.execPath, [bin, '--format', 'json', 'mobile'], { cwd: fixtureDir, encoding: 'utf8' });
	assert.equal(result.stderr, '', result.stderr);

	return JSON.parse(result.stdout).diagnostics.map((d) => ({
		// oxlint names files by URL on macOS and relative to its working directory on Linux
		file: path.relative(fixtureDir, d.filename.startsWith('file:') ? fileURLToPath(d.filename) : path.resolve(fixtureDir, d.filename)),
		code: d.code ?? null,
		message: d.message,
	}));
}

describe('mobile preset', () => {
	let diagnostics;
	const demo = 'mobile/install/mobileapp/mobile/extensions/bitrix/demo/extension.js';

	before(function ()
	{
		this.timeout(60000);
		diagnostics = lintFixture();
	});

	it('runs every JS plugin without errors', () => {
		assert.deepEqual(diagnostics.filter((d) => !d.code), []);
	});

	it('defines the JaNative globals', () => {
		assert.deepEqual(diagnostics.filter((d) => d.code === 'eslint(no-undef)'), []);
	});

	it('turns off the web-only rules', () => {
		assert.ok(!diagnostics.some((d) => d.file === demo && d.code === '@bitrix24/bitrix24-rules(no-bx)'));
	});

	it('enables the JaNative rules', () => {
		const codes = new Set(diagnostics.filter((d) => d.file === demo).map((d) => d.code));
		assert.ok(codes.has('@bitrix24/bitrix24-janative(no-global-require)'), [...codes].join(', '));
	});
});
