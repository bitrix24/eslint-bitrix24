// Bundles the third-party rules the preset uses into dist/ so that the published
// package depends neither on the ESLint plugins nor on eslint itself.
//
// The list of rules is taken from the preset: every `@stylistic/*`, `@bitrix24/unicorn/*`
// and `@bitrix24/vue/*` rule it configures gets bundled, nothing else.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

import { collectRuleIds } from '../config/collect-rule-ids.js';

const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const distDir = path.join(packageDir, 'dist');
const require = (await import('node:module')).createRequire(import.meta.url);

// Root directory of an installed package (its exports map may hide package.json).
function packageRoot(name)
{
	let dir = path.dirname(require.resolve(name));
	while (!fs.existsSync(path.join(dir, 'package.json')) || JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).name !== name)
	{
		dir = path.dirname(dir);
	}

	return dir;
}

const BUNDLES = [
	{
		file: 'stylistic.js',
		prefix: '@stylistic/',
		pluginName: '@stylistic',
		// rule modules of @stylistic export the rule under an internal name; take it from the plugin
		header: "import plugin from '@stylistic/eslint-plugin';",
		rule: (name) => `plugin.rules[${JSON.stringify(name)}]`,
		// ESLint core ids the rules had before they moved to @stylistic
		legacyId: "(name) => ({ 'function-call-spacing': 'func-call-spacing' })[name] ?? name",
	},
	{
		file: 'unicorn.js',
		prefix: '@bitrix24/unicorn/',
		pluginName: '@bitrix24/unicorn',
		// unicorn rules are written against unicorn's own context; the plugin converts them
		// with toEslintRule(), so the bundle does the same
		header: `import toEslintRule from ${JSON.stringify(path.join(packageRoot('eslint-plugin-unicorn'), 'rules', 'rule', 'to-eslint-rule.js'))};`,
		ruleModule: (name) => path.join(packageRoot('eslint-plugin-unicorn'), 'rules', `${name}.js`),
		convert: (name, expression) => `toEslintRule(${JSON.stringify(name)}, ${expression})`,
		legacyId: '(name) => `unicorn/${name}`',
	},
	{
		file: 'vue.js',
		prefix: '@bitrix24/vue/',
		pluginName: '@bitrix24/vue',
		// CommonJS modules with `exports.default = rule`. Loading the whole plugin is not an option:
		// it wraps ESLint core rules eagerly.
		ruleModule: (name) => path.join(packageRoot('eslint-plugin-vue'), 'dist', 'rules', `${name}.js`),
		header: '',
		legacyId: '(name) => `vue/${name}`',
		// the rules also recognize components by their shape and factory (plugins/vue-components.js)
		wrap: { module: path.join(packageDir, 'plugins', 'vue-components.js'), name: 'withComponentMarks' },
	},
];

// eslint must never end up in the bundle. Some bundled modules reference it lazily
// (for example, eslint-plugin-vue wraps core rules on demand); the stub fails loudly
// if such a path is ever taken.
const eslintImporters = new Set();
const stubEslint = {
	name: 'stub-eslint',
	setup(build)
	{
		build.onResolve({ filter: /^eslint(\/.*)?$/ }, (args) => {
			eslintImporters.add(path.relative(packageDir, args.importer));

			return { path: args.path, namespace: 'stub-eslint' };
		});
		build.onLoad({ filter: /.*/, namespace: 'stub-eslint' }, (args) => ({
			contents: `
				const fail = () => { throw new Error('${args.path} is not available in @bitrix24/oxlint-config-bitrix24'); };
				const stub = new Proxy(fail, { get: fail, apply: fail, construct: fail });
				module.exports = stub;
			`,
			loader: 'js',
		}));
	},
};

const ruleIds = await collectRuleIds();
fs.rmSync(distDir, { recursive: true, force: true });

const legalInputs = new Set();
for (const bundle of BUNDLES)
{
	const names = [...ruleIds].filter((id) => id.startsWith(bundle.prefix)).map((id) => id.slice(bundle.prefix.length)).sort();
	const imports = bundle.rule
		? bundle.header
		: [bundle.header ?? '', ...names.map((name, i) => `import * as rule${i} from ${JSON.stringify(bundle.ruleModule(name))};`)].join('\n');
	const ruleExpression = (name, i) => {
		if (bundle.rule)
		{
			return bundle.rule(name);
		}

		return bundle.convert ? bundle.convert(name, `rule${i}.default`) : `unwrap(rule${i})`;
	};
	const entries = names.map((name, i) => `\t${JSON.stringify(name)}: ${ruleExpression(name, i)},`).join('\n');
	const wrapImport = bundle.wrap ? `import { ${bundle.wrap.name} } from ${JSON.stringify(bundle.wrap.module)};` : '';
	const plugin = `{
	meta: { name: ${JSON.stringify(bundle.pluginName)} },
	rules,
}`;
	const contents = `
import { withLegacyNames } from ${JSON.stringify(path.join(packageDir, 'plugins', 'legacy-names.js'))};
${wrapImport}
${imports}

// ESM default export, or CommonJS \`exports.default\` seen through the ESM interop
const unwrap = (module) => [module, module?.default, module?.default?.default].find((candidate) => typeof candidate?.create === 'function');

const rules = {
${entries}
};

for (const [name, rule] of Object.entries(rules))
{
	if (typeof rule?.create !== 'function')
	{
		throw new Error(\`${bundle.pluginName}: rule \${name} is not bundled correctly\`);
	}
}

export default withLegacyNames(${bundle.wrap ? `${bundle.wrap.name}(${plugin})` : plugin}, ${bundle.legacyId});
`;

	const result = await esbuild.build({
		stdin: { contents, resolveDir: packageDir, sourcefile: bundle.file },
		bundle: true,
		platform: 'node',
		format: 'esm',
		target: 'node22',
		outfile: path.join(distDir, bundle.file),
		plugins: [stubEslint],
		// CommonJS dependencies call require() for node built-ins
		banner: { js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);" },
		legalComments: 'none',
		metafile: true,
		logLevel: 'warning',
	});

	for (const input of Object.keys(result.metafile.inputs))
	{
		legalInputs.add(input);
	}

	console.log(`${bundle.file}: ${names.length} rules`);
}

if (eslintImporters.size > 0)
{
	console.log(`eslint is stubbed for: ${[...eslintImporters].join(', ')}`);
}

// THIRD-PARTY-NOTICES.md: license texts of every package that ended up in dist/
const packages = new Map();
for (const input of legalInputs)
{
	const match = input.match(/node_modules\/((?:@[^/]+\/)?[^/]+)\//);
	if (!match || packages.has(match[1]))
	{
		continue;
	}

	const dir = path.join(packageDir, input.slice(0, input.indexOf(match[0]) + match[0].length));
	const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
	const licenseFile = fs.readdirSync(dir).find((f) => /^(licen[cs]e|copying)(\.|$)/i.test(f));
	packages.set(match[1], {
		version: pkg.version,
		license: pkg.license ?? 'UNKNOWN',
		text: licenseFile ? fs.readFileSync(path.join(dir, licenseFile), 'utf8').trim() : null,
	});
}

const notices = [
	'# Third-party notices',
	'',
	'`dist/` bundles code from the following packages.',
	'',
	...[...packages.entries()].sort(([a], [b]) => a.localeCompare(b)).flatMap(([name, { version, license, text }]) => [
		`## ${name}@${version} (${license})`,
		'',
		text ? ['```', text, '```'].join('\n') : '_No license file in the package._',
		'',
	]),
].join('\n');
fs.writeFileSync(path.join(packageDir, 'THIRD-PARTY-NOTICES.md'), notices);

const licenses = [...packages.values()].map((p) => p.license);
const unexpected = licenses.filter((l) => !/^(MIT|ISC|BSD-2-Clause|BSD-3-Clause|Apache-2\.0|0BSD)$/.test(l));
console.log(`bundled packages: ${packages.size} (${[...new Set(licenses)].join(', ')})`);
if (unexpected.length > 0)
{
	console.error(`unexpected licenses: ${unexpected.join(', ')}`);
	process.exit(1);
}
