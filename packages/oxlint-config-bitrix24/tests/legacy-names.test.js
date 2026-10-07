import { RuleTester } from 'oxlint/plugins-dev';
import { withLegacyNames } from '../plugins/legacy-names.js';

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
