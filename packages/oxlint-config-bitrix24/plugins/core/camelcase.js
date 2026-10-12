// Requires camelCase for names declared in the file: variables, functions, classes,
// parameters, imports, and names the file exports. Property names are not checked
// (the preset uses ESLint's `properties: 'never'`).
//
// Options (subset of ESLint's camelcase): `allow: string[]` (exact names or regular
// expressions starting with `^`), `ignoreDestructuring`, `ignoreImports`, `ignoreGlobals`.

function isUnderscored(name)
{
	const body = name.replace(/^_+|_+$/g, '');

	return body.includes('_') && body !== body.toUpperCase();
}

function isDestructuringDefinition(def)
{
	if (def.type !== 'Variable' && def.type !== 'Parameter')
	{
		return false;
	}

	let node = def.name.parent;
	while (node && node !== def.node)
	{
		if (node.type === 'ObjectPattern' || node.type === 'ArrayPattern')
		{
			return true;
		}
		node = node.parent;
	}

	return false;
}

export default {
	meta: {
		type: 'suggestion',
		docs: { description: 'Enforce camelcase naming convention' },
		schema: [
			{
				type: 'object',
				properties: {
					ignoreDestructuring: { type: 'boolean' },
					ignoreImports: { type: 'boolean' },
					ignoreGlobals: { type: 'boolean' },
					properties: { enum: ['always', 'never'] },
					allow: { type: 'array', items: { type: 'string' } },
				},
				additionalProperties: false,
			},
		],
		messages: {
			notCamelCase: "Identifier '{{name}}' is not in camel case.",
		},
	},
	create(context)
	{
		const options = context.options[0] ?? {};
		const allow = (options.allow ?? []).map((entry) => (entry.startsWith('^') ? new RegExp(entry, 'u') : entry));
		const isAllowed = (name) => allow.some((entry) => (typeof entry === 'string' ? entry === name : entry.test(name)));
		const shouldReport = (name) => isUnderscored(name) && !isAllowed(name);
		const reported = new Set();

		const report = (node) => {
			if (reported.has(node))
			{
				return;
			}
			reported.add(node);
			context.report({ node, messageId: 'notCamelCase', data: { name: node.name } });
		};

		const checkVariable = (variable) => {
			if (variable.defs.length === 0 || !shouldReport(variable.name))
			{
				return;
			}

			if (options.ignoreDestructuring && variable.defs.every(isDestructuringDefinition))
			{
				return;
			}

			if (options.ignoreImports && variable.defs.every((def) => def.type === 'ImportBinding'))
			{
				return;
			}

			for (const def of variable.defs)
			{
				report(def.name);
			}

			for (const reference of variable.references)
			{
				report(reference.identifier);
			}
		};

		return {
			'Program:exit'(node)
			{
				const scopeManager = context.sourceCode.scopeManager;
				for (const scope of scopeManager.scopes)
				{
					for (const variable of scope.variables)
					{
						checkVariable(variable);
					}
				}

				if (!options.ignoreGlobals)
				{
					const globalScope = scopeManager.globalScope ?? context.sourceCode.getScope(node);
					for (const reference of globalScope.through)
					{
						const name = reference.identifier.name;
						if (!reference.resolved && shouldReport(name))
						{
							report(reference.identifier);
						}
					}
				}
			},

			ExportSpecifier(node)
			{
				const exported = node.exported;
				if (exported && exported.type === 'Identifier' && exported !== node.local && shouldReport(exported.name))
				{
					report(exported);
				}
			},
		};
	},
};
