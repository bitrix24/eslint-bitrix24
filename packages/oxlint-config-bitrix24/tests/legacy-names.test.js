import * as assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { RuleTester } from 'oxlint/plugins-dev';
import { withLegacyNames } from '../plugins/legacy-names.js';

const require = createRequire(import.meta.url);

// Reports every `debugger` statement; its legacy id is `no-stop`.
const plugin = withLegacyNames({
	rules: {
		'stop': {
			meta: { messages: { found: 'found' } },
			create(context)
			{
				return {
					DebuggerStatement(node)
					{
						context.report({ node, messageId: 'found' });
					},
				};
			},
		},
	},
}, (name) => `no-${name}`);

const found = { messageId: 'found' };

new RuleTester().run('legacy-names', plugin.rules.stop, {
	valid: [
		'debugger; // eslint-disable-line no-stop',
		'debugger; // eslint-disable-line other, no-stop -- reason',
		'// eslint-disable-next-line no-stop\ndebugger;',
		'/* eslint-disable no-stop */\ndebugger;\ndebugger;',
	],
	invalid: [
		{ code: 'debugger;', errors: [found] },
		{ code: 'debugger; // eslint-disable-line other', errors: [found] },
		{ code: '// eslint-disable-next-line no-stop\ndebugger;\ndebugger;', errors: [{ ...found, line: 3 }] },
		{ code: '/* eslint-disable no-stop */\ndebugger;\n/* eslint-enable no-stop */\ndebugger;', errors: [{ ...found, line: 4 }] },
		{ code: 'debugger;\n/* eslint-disable no-stop */\ndebugger;', errors: [{ ...found, line: 1 }] },
	],
});


describe('legacy-names', () => {
	it('gives every file a context of its own', () => {
		// one thread lints all files, so oxlint hands the rule the same context object each time
		const fixtureDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'context-per-file');
		const bin = path.join(path.dirname(require.resolve('oxlint/package.json')), 'bin', 'oxlint');
		const result = spawnSync(process.execPath, [bin, '--threads=1', '--format', 'json', 'src'], { cwd: fixtureDir, encoding: 'utf8' });
		const reported = JSON.parse(result.stdout).diagnostics
			.map((d) => [path.basename(d.filename, '.js'), d.message])
			.sort();

		assert.deepEqual(reported, [['four', 'four'], ['one', 'one'], ['three', 'three'], ['two', 'two']]);
	});
});
