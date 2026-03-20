import * as path from 'node:path';
import * as fs from 'node:fs';
import { readFileSync } from 'node:fs';

const repoPath = import.meta.dirname.split('node_modules').at(0);
const aliasesConfigPath = path.join(repoPath, 'webpack.aliases.js');

function loadAliasesConfig()
{
	try
	{
		const content = readFileSync(aliasesConfigPath, 'utf-8');
		const match = content.match(/allowedModules\s*:\s*\[([^\]]*)\]/);
		if (match)
		{
			const modules = match[1]
				.split(',')
				.map(s => s.trim().replace(/^['"]|['"]$/g, ''))
				.filter(Boolean);
			return modules;
		}
	}
	catch
	{
		// File not found or parse error
	}

	return null;
}

export default {
	meta: {
		type: 'problem',
		schema: [],
		fixable: null,
		messages: {},
	},
	create(context) {
		return {
			ImportDeclaration(node) {
				const allowedModules = (() => {
					const defaultAllowedModules = ['main', 'ui'];
					if (fs.existsSync(aliasesConfigPath))
					{
						const configModules = loadAliasesConfig();
						if (Array.isArray(configModules))
						{
							return [...new Set([...configModules, ...defaultAllowedModules])];
						}
					}

					return defaultAllowedModules;
				})();

				const [moduleName] = String(node.source.value).split('.');
				if (
					String(moduleName).length > 1
					&& !allowedModules.includes(moduleName)
				)
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
