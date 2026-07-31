import { DEPENDENCY_TYPE } from './constants.js';
import { isFile, readTextFile } from './fs-utils.js';
import { findRootArray, scanPhp } from './php-array.js';

/** Order the PhpStorm plugin writes sections in. */
export const SECTION_ORDER = [
	DEPENDENCY_TYPE.COMPONENTS,
	DEPENDENCY_TYPE.EXTENSIONS,
	DEPENDENCY_TYPE.BUNDLE,
];

const KEEP_MARKER = '@keep';
const DEFAULT_INDENT = '\t';

function eolOf(source)
{
	return source.includes('\r\n') ? '\r\n' : '\n';
}

function lineStartOf(source, position)
{
	return source.lastIndexOf('\n', position - 1) + 1;
}

function lineEndOf(source, position)
{
	const newline = source.indexOf('\n', position);

	return newline === -1 ? source.length : newline + 1;
}

function indentOf(source, position)
{
	const start = lineStartOf(source, position);
	const match = /^[ \t]*/.exec(source.slice(start, position));

	return match === null ? '' : match[0];
}

/**
 * Mirror of `readString` in php-array.js: the reader only unescapes the backslash and the
 * quote, so the writer escapes exactly those two, and the backslash first.
 */
function escapePhpString(value, quote)
{
	return String(value).split('\\').join('\\\\').split(quote).join(`\\${quote}`);
}

/**
 * A `deps.php` file: what it lists, what is protected by `@keep`, and how to edit it
 * without disturbing its formatting.
 */
export class DepsFile
{
	#path;

	#source;

	#root = null;

	#sections = new Map();

	#entries = [];

	#kept = new Set();

	#valueSet = null;

	#exists;

	constructor(depsPath, source)
	{
		this.#path = depsPath;
		this.#source = source ?? '';
		this.#exists = source !== null && source !== undefined;

		if (this.#exists)
		{
			this.#parse();
		}
	}

	static read(depsPath)
	{
		return new DepsFile(depsPath, isFile(depsPath) ? readTextFile(depsPath) : null);
	}

	get path()
	{
		return this.#path;
	}

	get exists()
	{
		return this.#exists;
	}

	/** False when the file exists but returns no array at all - nothing here can edit it safely. */
	get parsed()
	{
		return this.#root !== null;
	}

	/** True when the file lists paths directly, without `components`/`extensions`/`bundle` sections. */
	get isFlat()
	{
		return this.#exists && this.#sections.size === 0;
	}

	/** @returns {Array<{value: string, section: string|null}>} */
	get entries()
	{
		return this.#entries.map(entry => ({ value: entry.value, section: entry.section }));
	}

	get values()
	{
		return new Set(this.#entries.map(entry => entry.value));
	}

	/** Paths marked `@keep`: they are never removed as unused. */
	get kept()
	{
		return new Set(this.#kept);
	}

	get sectionNames()
	{
		return [...this.#sections.keys()];
	}

	has(value)
	{
		if (this.#valueSet === null)
		{
			this.#valueSet = new Set(this.#entries.map(entry => entry.value));
		}

		return this.#valueSet.has(value);
	}

	/** Values listed more than once: the build reads one listing, the rest are dead weight. */
	get duplicates()
	{
		const seen = new Set();
		const doubled = [];

		for (const { value } of this.#entries)
		{
			if (seen.has(value) && !doubled.includes(value))
			{
				doubled.push(value);
			}
			seen.add(value);
		}

		return doubled;
	}

	sectionOf(value)
	{
		return this.#entries.find(entry => entry.value === value)?.section ?? null;
	}

	/**
	 * Applies additions and removals to the source text.
	 *
	 * @param {{add?: Object<string, string[]>, remove?: string[]}} change
	 * @returns {string|null} new source, or null when nothing is left to keep and the file should go
	 */
	apply({ add = {}, remove = [] } = {})
	{
		const removals = new Set(remove.filter(value => !this.#kept.has(value)));
		const additions = this.#pendingAdditions(add);
		const redundant = this.#redundantEntries(removals);

		// Nothing asked for means nothing written: an untouched file keeps every byte,
		// including a missing trailing newline and an already empty section.
		if (removals.size === 0 && !hasAdditions(additions) && redundant.size === 0)
		{
			return this.#exists ? this.#source : null;
		}

		if (!this.#exists)
		{
			return hasAdditions(additions) ? renderNewDepsFile(additions) : null;
		}

		// A file that returns no array is left exactly as it is: there is nothing to edit,
		// and overwriting it would throw away whatever a human put there.
		if (!this.parsed)
		{
			return this.#source;
		}

		if (this.isFlat)
		{
			return this.#applyFlat(removals, additions, redundant);
		}

		return this.#applySectioned(removals, additions, redundant);
	}

	/** Repeat listings of a surviving value: the first occurrence speaks, the rest go. */
	#redundantEntries(removals)
	{
		const seen = new Set();
		const redundant = new Set();

		for (const entry of this.#entries)
		{
			if (removals.has(entry.value))
			{
				continue;
			}

			if (seen.has(entry.value))
			{
				redundant.add(entry);
			}
			seen.add(entry.value);
		}

		return redundant;
	}

	#pendingAdditions(add)
	{
		const pending = {};
		const known = this.values;

		for (const section of SECTION_ORDER)
		{
			const values = (add[section] ?? []).filter(value => !known.has(value));
			if (values.length > 0)
			{
				pending[section] = values;
			}
		}

		return pending;
	}

	#applyFlat(removals, additions, redundant)
	{
		// A flat file keeps its shape: entries are appended, sections are not introduced.
		const flattened = Object.values(additions).flat();
		const survivors = this.#entries
			.filter(entry => !removals.has(entry.value) && !redundant.has(entry));

		if (survivors.length === 0 && flattened.length === 0)
		{
			return null;
		}

		const edits = this.#entries
			.filter(entry => removals.has(entry.value) || redundant.has(entry))
			.map(entry => this.#removalEdit(entry));

		if (flattened.length > 0)
		{
			edits.push(this.#additionEdit(this.#root, survivors, flattened));
		}

		return applyEdits(this.#source, edits);
	}

	#applySectioned(removals, additions, redundant)
	{
		const edits = [];
		let survivingSections = 0;

		for (const [name, section] of this.#sections)
		{
			const survivors = section.entries
				.filter(entry => !removals.has(entry.value) && !redundant.has(entry));
			const incoming = additions[name] ?? [];
			delete additions[name];

			if (survivors.length === 0 && incoming.length === 0)
			{
				edits.push(fullLineEdit(this.#source, section.token.start, section.array.end, ''));
				continue;
			}

			survivingSections += 1;

			for (const entry of section.entries)
			{
				if (removals.has(entry.value) || redundant.has(entry))
				{
					edits.push(this.#removalEdit(entry));
				}
			}

			if (incoming.length > 0)
			{
				edits.push(this.#additionEdit(section.array, survivors, incoming));
			}
		}

		// #pendingAdditions only stores non-empty sections, so whatever is left is real.
		const newSections = Object.entries(additions);

		if (survivingSections === 0 && newSections.length === 0)
		{
			return null;
		}

		for (const [name, values] of newSections)
		{
			edits.push(this.#newSectionEdit(name, values));
		}

		return applyEdits(this.#source, edits);
	}

	#removalEdit(entry)
	{
		const { token } = entry;
		const lineStart = lineStartOf(this.#source, token.start);
		const lineEnd = lineEndOf(this.#source, token.end);
		const before = this.#source.slice(lineStart, token.start);
		const after = this.#source.slice(token.end, lineEnd);

		if (/^[ \t]*$/.test(before) && /^\s*,?\s*$/.test(after))
		{
			return { start: lineStart, end: lineEnd, text: '' };
		}

		// Inline entry: take the comma that binds it to a neighbour, whichever side it is on.
		const trailing = /^[ \t]*,[ \t]*/.exec(after);
		if (trailing !== null)
		{
			return { start: token.start, end: token.end + trailing[0].length, text: '' };
		}

		const leading = /[ \t]*,[ \t]*$/.exec(before);

		return {
			start: token.start - (leading === null ? 0 : leading[0].length),
			end: token.end,
			text: '',
		};
	}

	/** Line ending of the file itself, so an insertion does not mix endings. */
	get #eol()
	{
		return eolOf(this.#source);
	}

	#additionEdit(array, survivors, values)
	{
		const anchor = survivors.length > 0 ? survivors[survivors.length - 1].token : null;
		const quote = anchor?.quote ?? "'";
		const eol = this.#eol;
		const indent = anchor === null
			? indentOf(this.#source, array.start) + DEFAULT_INDENT
			: indentOf(this.#source, anchor.start);
		const at = anchor === null
			? lineEndOf(this.#source, array.start)
			: lineEndOf(this.#source, anchor.end);
		const text = values
			.map(value => `${indent}${quote}${escapePhpString(value, quote)}${quote},${eol}`)
			.join('');

		return { start: at, end: at, text };
	}

	#newSectionEdit(name, values)
	{
		const anchor = this.#sectionAnchor(name);
		const eol = this.#eol;
		const indent = anchor === null
			? indentOf(this.#source, this.#root.start) + DEFAULT_INDENT
			: indentOf(this.#source, anchor.section.token.start);
		const inner = indent + DEFAULT_INDENT;
		const quote = this.#entries[0]?.token.quote ?? "'";
		const lines = values
			.map(value => `${inner}${quote}${escapePhpString(value, quote)}${quote},${eol}`)
			.join('');
		const block = `${indent}${quote}${name}${quote} => [${eol}${lines}${indent}],${eol}`;

		const at = anchor === null
			? lineEndOf(this.#source, this.#root.start)
			: (anchor.before
				? lineStartOf(this.#source, anchor.section.token.start)
				: lineEndOf(this.#source, anchor.section.array.end));

		return { start: at, end: at, text: block };
	}

	/** Where a new section goes: before the first later section, otherwise after the last earlier one. */
	#sectionAnchor(name)
	{
		const ordinal = SECTION_ORDER.indexOf(name);

		for (const [existing, section] of this.#sections)
		{
			if (SECTION_ORDER.indexOf(existing) > ordinal)
			{
				return { section, before: true };
			}
		}

		const last = [...this.#sections.values()].at(-1) ?? null;

		return last === null ? null : { section: last, before: false };
	}

	#parse()
	{
		const { tokens, comments } = scanPhp(this.#source);
		this.#root = findRootArray(tokens);

		if (this.#root === null)
		{
			return;
		}

		for (const item of this.#root.items)
		{
			if (item.array === undefined)
			{
				this.#entries.push({ value: item.value, token: item.token, section: null });
				continue;
			}

			const entries = item.array.items
				.filter(nested => nested.array === undefined)
				.map(nested => ({ value: nested.value, token: nested.token, section: item.key }));

			this.#sections.set(item.key, { token: item.token, array: item.array, entries });
			this.#entries.push(...entries);
		}

		this.#markKept(comments);
	}

	#markKept(comments)
	{
		// Same line means same line start; a full line index is overkill for that question.
		const keepLines = new Set(
			comments
				.filter(comment => comment.text.includes(KEEP_MARKER))
				.map(comment => lineStartOf(this.#source, comment.start)),
		);

		for (const entry of this.#entries)
		{
			if (keepLines.has(lineStartOf(this.#source, entry.token.start)))
			{
				this.#kept.add(entry.value);
			}
		}
	}
}

function hasAdditions(additions)
{
	return Object.keys(additions).length > 0;
}

function fullLineEdit(source, start, end, text)
{
	return { start: lineStartOf(source, start), end: lineEndOf(source, end), text };
}

function applyEdits(source, edits)
{
	if (edits.length === 0)
	{
		return source;
	}

	const ordered = [...edits].sort((left, right) => right.start - left.start || right.end - left.end);
	let result = source;

	for (const edit of ordered)
	{
		result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
	}

	return ensureTrailingNewline(result, eolOf(source));
}

function ensureTrailingNewline(text, eol)
{
	return text.endsWith('\n') ? text : `${text}${eol}`;
}

/** Fresh `deps.php` for an extension that had none. */
export function renderNewDepsFile(additions)
{
	const blocks = SECTION_ORDER
		.filter(section => (additions[section] ?? []).length > 0)
		.map(section => {
			const lines = additions[section]
				.map(value => `\t\t'${escapePhpString(value, "'")}',\n`)
				.join('');

			return `\t'${section}' => [\n${lines}\t],\n`;
		})
		.join('');

	return `<?php\n\nreturn [\n${blocks}];\n`;
}
