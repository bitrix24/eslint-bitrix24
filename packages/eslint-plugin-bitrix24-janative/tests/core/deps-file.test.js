import assert from 'node:assert/strict';

import { DepsFile, renderNewDepsFile } from '../../core/deps-file.js';

function depsFile(source)
{
	return new DepsFile('/tmp/deps.php', source);
}

const SECTIONED = `<?php

return [
	'extensions' => [
		'loc',
		'tasks:dashboard',
	],
];
`;

describe('DepsFile', () => {
	describe('reading', () => {
		it('reads a sectioned file', () => {
			const deps = depsFile(SECTIONED);

			assert.equal(deps.exists, true);
			assert.equal(deps.isFlat, false);
			assert.deepEqual(deps.sectionNames, ['extensions']);
			assert.deepEqual([...deps.values], ['loc', 'tasks:dashboard']);
			assert.equal(deps.sectionOf('loc'), 'extensions');
		});

		it('reads every section and keeps entries apart', () => {
			const deps = depsFile(`<?php
return [
	'components' => ['tasks:tasks.list'],
	'extensions' => ['loc'],
	'bundle' => ['./src/loader'],
];
`);

			assert.deepEqual(deps.sectionNames, ['components', 'extensions', 'bundle']);
			assert.equal(deps.sectionOf('./src/loader'), 'bundle');
		});

		it('reads a short opening tag', () => {
			const deps = depsFile("<?\n\nreturn [\n\t'extensions' => [\n\t\t'loc',\n\t],\n];\n");

			assert.deepEqual([...deps.values], ['loc']);
		});

		it('reads double quotes', () => {
			const deps = depsFile('<?php\n\nreturn [\n\t"extensions" => [\n\t\t"loc",\n\t],\n];\n');

			assert.deepEqual([...deps.values], ['loc']);
			assert.equal(deps.sectionOf('loc'), 'extensions');
		});

		it('ignores comments inside the array', () => {
			const deps = depsFile(`<?php

return [
	// legacy, see the ticket
	'extensions' => [
		'loc', // localization
		# 'disabled',
		/* 'also-disabled' */
		'type',
	],
];
`);

			assert.deepEqual([...deps.values], ['loc', 'type']);
		});

		it('reads a flat list without sections', () => {
			const deps = depsFile("<?php\n\nreturn ['files', 'rest'];\n");

			assert.equal(deps.isFlat, true);
			assert.deepEqual([...deps.values], ['files', 'rest']);
			assert.equal(deps.sectionOf('files'), null);
		});

		it('keeps a backslash that PHP does not treat as an escape', () => {
			const deps = depsFile("<?php\n\nreturn [\n\t'bundle' => [\n\t\t'./src\\\\view',\n\t],\n];\n");

			assert.deepEqual([...deps.values], ['./src\\view']);
		});

		it('treats an unknown key as a section, not as an entry', () => {
			const deps = depsFile("<?php\n\nreturn [\n\t'extension' => [\n\t\t'loc',\n\t],\n];\n");

			assert.deepEqual([...deps.values], ['loc']);
			assert.deepEqual(deps.sectionNames, ['extension']);
		});

		it('refuses to edit a file that returns no array', () => {
			const source = '<?php\n';
			const deps = depsFile(source);

			assert.equal(deps.exists, true);
			assert.equal(deps.parsed, false);
			assert.equal(deps.apply({ add: { extensions: ['loc'] } }), source);
		});

		it('is absent when there is no file', () => {
			const deps = new DepsFile('/tmp/deps.php', null);

			assert.equal(deps.exists, false);
			assert.deepEqual([...deps.values], []);
		});
	});

	describe('@keep', () => {
		it('protects an entry marked on its line', () => {
			const deps = depsFile(`<?php

return [
	'extensions' => [
		'loc', // @keep needed by the native side
		'type',
	],
];
`);

			assert.deepEqual([...deps.kept], ['loc']);
		});

		it('never removes a protected entry', () => {
			const source = `<?php

return [
	'extensions' => [
		'loc', // @keep
		'type',
	],
];
`;
			const result = depsFile(source).apply({ remove: ['loc', 'type'] });

			assert.equal(result.includes("'loc', // @keep"), true);
			assert.equal(result.includes("'type'"), false);
		});
	});

	describe('editing', () => {
		it('leaves the file untouched when nothing changes', () => {
			assert.equal(depsFile(SECTIONED).apply(), SECTIONED);
		});

		it('leaves the file untouched when the addition is already listed', () => {
			assert.equal(depsFile(SECTIONED).apply({ add: { extensions: ['loc'] } }), SECTIONED);
		});

		it('appends to an existing section keeping its indentation and quotes', () => {
			const result = depsFile(SECTIONED).apply({ add: { extensions: ['type'] } });

			assert.equal(result, `<?php

return [
	'extensions' => [
		'loc',
		'tasks:dashboard',
		'type',
	],
];
`);
		});

		it('creates a missing section in the canonical order', () => {
			const result = depsFile(SECTIONED).apply({ add: { components: ['tasks:tasks.list'] } });

			assert.equal(result, `<?php

return [
	'components' => [
		'tasks:tasks.list',
	],
	'extensions' => [
		'loc',
		'tasks:dashboard',
	],
];
`);
		});

		it('places a bundle section after the existing ones', () => {
			const result = depsFile(SECTIONED).apply({ add: { bundle: ['./src/loader'] } });

			assert.equal(result, `<?php

return [
	'extensions' => [
		'loc',
		'tasks:dashboard',
	],
	'bundle' => [
		'./src/loader',
	],
];
`);
		});

		it('removes an entry with its line', () => {
			const result = depsFile(SECTIONED).apply({ remove: ['loc'] });

			assert.equal(result, `<?php

return [
	'extensions' => [
		'tasks:dashboard',
	],
];
`);
		});

		it('removes a section left empty', () => {
			const result = depsFile(`<?php

return [
	'components' => [
		'tasks:tasks.list',
	],
	'extensions' => [
		'loc',
	],
];
`).apply({ remove: ['tasks:tasks.list'] });

			assert.equal(result, `<?php

return [
	'extensions' => [
		'loc',
	],
];
`);
		});

		it('reports that nothing is left to keep', () => {
			assert.equal(depsFile(SECTIONED).apply({ remove: ['loc', 'tasks:dashboard'] }), null);
		});

		it('removes an entry sharing a line with others', () => {
			const result = depsFile("<?php\n\nreturn [\n\t'extensions' => ['loc', 'type'],\n];\n").apply({
				remove: ['loc'],
			});

			assert.equal(result, "<?php\n\nreturn [\n\t'extensions' => ['type'],\n];\n");
		});

		it('removes the last entry of a line without leaving a dangling comma', () => {
			const result = depsFile("<?php\n\nreturn [\n\t'extensions' => ['loc', 'type'],\n];\n").apply({
				remove: ['type'],
			});

			assert.equal(result, "<?php\n\nreturn [\n\t'extensions' => ['loc'],\n];\n");
		});

		it('keeps a flat file flat', () => {
			const result = depsFile("<?php\n\nreturn [\n\t'files',\n\t'rest',\n];\n").apply({
				add: { extensions: ['loc'] },
			});

			assert.equal(result, "<?php\n\nreturn [\n\t'files',\n\t'rest',\n\t'loc',\n];\n");
		});

		it('writes a new file when there was none', () => {
			const result = new DepsFile('/tmp/deps.php', null).apply({
				add: { extensions: ['loc'], bundle: ['./src/loader'] },
			});

			assert.equal(result, `<?php

return [
	'extensions' => [
		'loc',
	],
	'bundle' => [
		'./src/loader',
	],
];
`);
		});

		it('writes nothing when there was no file and nothing to add', () => {
			assert.equal(new DepsFile('/tmp/deps.php', null).apply(), null);
		});

		it('is stable: applying the same change twice changes nothing', () => {
			const once = depsFile(SECTIONED).apply({ add: { extensions: ['type'] } });
			const twice = depsFile(once).apply({ add: { extensions: ['type'] } });

			assert.equal(twice, once);
		});
	});

	describe('renderNewDepsFile', () => {
		it('writes sections in the canonical order', () => {
			const result = renderNewDepsFile({ bundle: ['./a'], components: ['m:c'], extensions: ['loc'] });

			assert.equal(result.indexOf("'components'") < result.indexOf("'extensions'"), true);
			assert.equal(result.indexOf("'extensions'") < result.indexOf("'bundle'"), true);
		});
	});
});
