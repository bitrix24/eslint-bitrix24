import * as assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

import preset from '../index.js';

const require = createRequire(import.meta.url);
const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fixtureDir = path.join(packageDir, 'tests', 'fixtures', 'preset');

function lintFixture()
{
	const bin = path.join(path.dirname(require.resolve('oxlint/package.json')), 'bin', 'oxlint');
	const result = spawnSync(process.execPath, [bin, '--format', 'json', 'ext'], { cwd: fixtureDir, encoding: 'utf8' });
	assert.equal(result.stderr, '', result.stderr);
	const { diagnostics } = JSON.parse(result.stdout);

	return diagnostics.map((d) => ({
		file: path.relative(fixtureDir, d.filename.startsWith('file:') ? fileURLToPath(d.filename) : d.filename),
		line: d.labels?.[0]?.span?.line ?? 0,
		code: d.code ?? null,
		message: d.message,
	}));
}

// eslint-style schema check: an array schema describes positional options, an object
// schema describes the options array as a whole
function validateOptions(ajv, rule, options)
{
	const schema = rule.meta?.schema;
	if (!schema || options.length === 0)
	{
		return null;
	}

	const fullSchema = Array.isArray(schema)
		? { type: 'array', items: schema, minItems: 0, maxItems: schema.length }
		: schema;
	const validate = ajv.compile(fullSchema);

	return validate(options) ? null : ajv.errorsText(validate.errors);
}

describe('preset', () => {
	it('configures JS rules with options their schemas accept', async () => {
		const plugins = new Map();
		for (const { name, specifier } of preset.jsPlugins)
		{
			plugins.set(name, (await import(specifier)).default);
		}

		const ajv = new Ajv({ strict: false, allErrors: true, useDefaults: false, validateSchema: false });
		const entries = [preset.rules, ...preset.overrides.map((o) => o.rules ?? {})].flatMap((r) => Object.entries(r));
		const problems = [];
		for (const [id, value] of entries)
		{
			const plugin = [...plugins.keys()].find((name) => id.startsWith(`${name}/`));
			if (!plugin)
			{
				continue;
			}

			const rule = plugins.get(plugin).rules[id.slice(plugin.length + 1)];
			if (!rule)
			{
				problems.push(`${id}: no such rule in ${plugin}`);
				continue;
			}

			const error = validateOptions(ajv, rule, Array.isArray(value) ? value.slice(1) : []);
			if (error)
			{
				problems.push(`${id}: ${error}`);
			}
		}

		assert.deepEqual(problems, []);
	});

	it('does not enable a core rule its eslint-plugin-unicorn replacement turned off', () => {
		// the ESLint preset turns no-nested-ternary off in favor of unicorn/no-nested-ternary
		assert.equal(preset.rules['no-nested-ternary'], undefined);
		assert.equal(preset.rules['unicorn/no-nested-ternary'], 'error');
	});

	describe('linting fixtures', () => {
		let diagnostics;
		const codesOf = (file) => new Set(diagnostics.filter((d) => d.file === file).map((d) => d.code));

		before(function ()
		{
			this.timeout(60000);
			diagnostics = lintFixture();
		});

		it('runs every JS plugin without errors', () => {
			assert.deepEqual(diagnostics.filter((d) => !d.code), []);
		});

		it('reports formatting through @stylistic and honors legacy disable directives', () => {
			const codes = codesOf('ext/src/format.js');
			assert.ok(codes.has('@stylistic(object-curly-spacing)'));
			assert.ok(codes.has('@stylistic(indent)'));
			assert.ok(codes.has('@stylistic(semi)'));
			assert.ok(codes.has('@bitrix24/bitrix24-rules(brace-on-same-line)'));
			const quotes = diagnostics.filter((d) => d.file === 'ext/src/format.js' && d.code === '@stylistic(quotes)');
			assert.deepEqual(quotes.map((d) => d.line), [5]);
		});

		it('reports bundled unicorn rules, core replacements and native rules', () => {
			const codes = codesOf('ext/src/legacy.js');
			assert.ok(codes.has('@bitrix24/unicorn(no-for-loop)'));
			assert.ok(codes.has('@bitrix24/core(dot-notation)'));
			assert.ok(codes.has('@bitrix24/core(camelcase)'));
			const camelcase = diagnostics.filter((d) => d.file === 'ext/src/legacy.js' && d.code === '@bitrix24/core(camelcase)');
			// line 9 is disabled by its legacy id; the declaration and both references of other_total are reported
			assert.deepEqual(camelcase.map((d) => d.line), [10, 10, 12]);
		});

		it('reports vue rules for components declared in .js files', () => {
			const codes = codesOf('ext/src/component.js');
			assert.ok(codes.has('@bitrix24/vue(require-prop-types)'));
			assert.ok(codes.has('@bitrix24/vue(order-in-components)'));
		});

		it('applies the TypeScript override', () => {
			const codes = codesOf('ext/src/typed.ts');
			assert.ok(!codes.has('eslint(no-undef)'));
		});

		it('applies the testing override', () => {
			const codes = codesOf('ext/test/format.test.js');
			assert.ok(!codes.has('eslint(no-undef)'));
		});
	});
});
