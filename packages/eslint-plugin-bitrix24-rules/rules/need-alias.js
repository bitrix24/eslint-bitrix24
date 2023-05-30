const path = require('path');
const fs = require('fs');

const repoPath = __dirname.split('node_modules').at(0);
const aliasesConfigPath = path.join(repoPath, 'webpack.aliases.js');

module.exports = {
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
						delete require.cache[aliasesConfigPath];
						const aliasesConfig = require(aliasesConfigPath);
						if (
							typeof aliasesConfig === 'object'
							&& Array.isArray(aliasesConfig.allowedModules)
						)
						{
							return [...new Set([...aliasesConfig.allowedModules, ...defaultAllowedModules])];
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
						message: `Add '${moduleName}' to webpack.aliases.js and resave webpack settings in PhpStorm Preferences. \nSee: http://docs.bx/R&D/bitrix_dev/javascript-dev/bitrix_cli/quick_start#page_Nastroyte_IntelliSense`,
					});
				}
			},
		};
	},
};
