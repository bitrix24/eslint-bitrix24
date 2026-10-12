// Disable directives written for ESLint name rules by their ESLint ids: `max-len`,
// `camelcase`, `vue/order-in-components`. In oxlint the same rules live in JS plugins
// under other ids (`@stylistic/max-len`), so those directives stop matching.
// `withLegacyNames` wraps every rule of a plugin so that a report is dropped when an
// `eslint-disable*` directive names the rule by its legacy id.
//
// Supported forms (ESLint semantics):
//   // eslint-disable-line <ids>
//   // eslint-disable-next-line <ids>
//   /* eslint-disable <ids> */ ... /* eslint-enable <ids> */
// Directives without ids are handled by oxlint itself.
//
// The wrapper also hands every rule a context of its own for each file. oxlint passes the
// same context object to `create` for every file a thread lints, and rules written for
// ESLint cache per-file data by context: eslint-plugin-vue keeps the `@vue/component`
// comments of a file in a WeakMap keyed by it, so they leaked into the next file.

const DIRECTIVE = /^\s*(eslint-disable-next-line|eslint-disable-line|eslint-disable|eslint-enable)(?:\s+([\s\S]*))?$/;

let lastText = null;
let lastDirectives = null;

function parseIds(value)
{
	if (!value)
	{
		return [];
	}

	const [ids] = value.split(/\s--\s/);

	return ids
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean);
}

function readDirectives(sourceCode)
{
	const text = sourceCode.text;
	if (text === lastText)
	{
		return lastDirectives;
	}

	const lines = new Map();
	const blocks = [];
	const open = new Map();

	for (const comment of sourceCode.getAllComments())
	{
		const match = DIRECTIVE.exec(comment.value);
		if (!match)
		{
			continue;
		}

		const [, kind, rest] = match;
		const ids = parseIds(rest);
		if (ids.length === 0)
		{
			continue;
		}

		if (kind === 'eslint-disable-line' || kind === 'eslint-disable-next-line')
		{
			const line = kind === 'eslint-disable-line' ? comment.loc.start.line : comment.loc.end.line + 1;
			for (const id of ids)
			{
				let set = lines.get(line);
				if (!set)
				{
					set = new Set();
					lines.set(line, set);
				}
				set.add(id);
			}

			continue;
		}

		if (comment.type !== 'Block')
		{
			continue;
		}

		for (const id of ids)
		{
			if (kind === 'eslint-disable')
			{
				if (!open.has(id))
				{
					open.set(id, comment.loc.end);
				}
			}
			else if (open.has(id))
			{
				blocks.push({ id, start: open.get(id), end: comment.loc.start });
				open.delete(id);
			}
		}
	}

	for (const [id, start] of open)
	{
		blocks.push({ id, start, end: null });
	}

	const mentioned = new Set([...blocks.map((b) => b.id), ...[...lines.values()].flatMap((s) => [...s])]);

	lastText = text;
	lastDirectives = { lines, blocks, mentioned };

	return lastDirectives;
}

function isBefore(a, b)
{
	return a.line < b.line || (a.line === b.line && a.column <= b.column);
}

function reportStart(descriptor)
{
	const loc = descriptor.loc ?? descriptor.node?.loc;
	if (!loc)
	{
		return null;
	}

	return loc.start ?? loc;
}

function isSuppressed(directives, id, descriptor)
{
	const start = reportStart(descriptor);
	if (!start)
	{
		return false;
	}

	if (directives.lines.get(start.line)?.has(id))
	{
		return true;
	}

	return directives.blocks.some((block) => block.id === id
		&& isBefore(block.start, start)
		&& (block.end === null || isBefore(start, block.end)));
}

/**
 * A context of its own for one file: it reads through to oxlint's context, whose `report`
 * may be replaced.
 */
function perFileContext(context, report)
{
	const bound = new Map();

	// The proxy target is a blank object: oxlint's `context.report` is a non-configurable
	// read-only property, which a proxy over the context itself may not replace.
	return new Proxy({}, {
		get(target, property)
		{
			if (property === 'report' && report)
			{
				return report;
			}

			const value = Reflect.get(context, property, context);
			if (typeof value !== 'function')
			{
				return value;
			}

			// methods of oxlint's context need it as `this`
			let method = bound.get(property);
			if (!method || method.original !== value)
			{
				method = { original: value, bound: value.bind(context) };
				bound.set(property, method);
			}

			return method.bound;
		},
		has: (target, property) => Reflect.has(context, property),
	});
}

function wrapRule(rule, legacyId)
{
	return {
		...rule,
		create(context)
		{
			const directives = readDirectives(context.sourceCode);
			const report = directives.mentioned.has(legacyId)
				? (descriptor) => {
					if (!isSuppressed(directives, legacyId, descriptor))
					{
						context.report(descriptor);
					}
				}
				: null;

			return rule.create(perFileContext(context, report));
		},
	};
}

/**
 * @param {{ meta?: object, rules: Record<string, object> }} plugin
 * @param {(ruleName: string) => string} toLegacyId - ESLint-era id of a rule
 */
export function withLegacyNames(plugin, toLegacyId)
{
	return {
		...plugin,
		rules: Object.fromEntries(
			Object.entries(plugin.rules).map(([name, rule]) => [name, wrapRule(rule, toLegacyId(name))]),
		),
	};
}
