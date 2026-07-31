/**
 * Minimal reader for the literal arrays `deps.php` files are made of.
 *
 * Every one of the 2265 files in the repository is a static literal array: no variables,
 * no calls, no includes. A PHP parser would be dead weight, so this scanner only knows
 * strings, brackets, arrows, commas and comments, and it keeps their offsets so that
 * edits can be applied to the original text without reformatting it.
 */

const PUNCTUATION = new Set(['[', ']', '(', ')', ',']);

/**
 * @returns {{tokens: Array, comments: Array}} tokens carry `start`/`end` offsets in the source
 */
export function scanPhp(source)
{
	const tokens = [];
	const comments = [];
	let position = 0;

	while (position < source.length)
	{
		const char = source[position];

		if (char === "'" || char === '"')
		{
			position = readString(source, position, tokens);
			continue;
		}

		if ((char === '/' && source[position + 1] === '/') || char === '#')
		{
			position = readLineComment(source, position, comments);
			continue;
		}

		if (char === '/' && source[position + 1] === '*')
		{
			position = readBlockComment(source, position, comments);
			continue;
		}

		if (PUNCTUATION.has(char))
		{
			tokens.push({ type: 'punctuation', value: char, start: position, end: position + 1 });
			position += 1;
			continue;
		}

		if (char === '=' && source[position + 1] === '>')
		{
			tokens.push({ type: 'punctuation', value: '=>', start: position, end: position + 2 });
			position += 2;
			continue;
		}

		position += 1;
	}

	return { tokens, comments };
}

function readString(source, start, tokens)
{
	const quote = source[start];
	let position = start + 1;
	let value = '';

	while (position < source.length && source[position] !== quote)
	{
		// PHP only escapes the quote and the backslash itself; anything else keeps its backslash,
		// which matters for bundle paths written with a Windows separator.
		const next = source[position + 1];
		if (source[position] === '\\' && (next === '\\' || next === quote))
		{
			value += next;
			position += 2;
			continue;
		}

		value += source[position];
		position += 1;
	}

	tokens.push({ type: 'string', value, quote, start, end: position + 1 });

	return position + 1;
}

function readLineComment(source, start, comments)
{
	const newline = source.indexOf('\n', start);
	const end = newline === -1 ? source.length : newline;

	comments.push({ start, end, text: source.slice(start, end) });

	return end;
}

function readBlockComment(source, start, comments)
{
	const closing = source.indexOf('*/', start + 2);
	const end = closing === -1 ? source.length : closing + 2;

	comments.push({ start, end, text: source.slice(start, end) });

	return end;
}

/**
 * Parses the array that starts at `tokens[index]` (a `[` token).
 *
 * @returns {{items: Array, start: number, end: number, next: number}|null}
 *          `items` are `{value, token}` for plain entries and `{key, token, array}` for `key => [...]`
 */
export function parseArray(tokens, index)
{
	if (tokens[index]?.value !== '[')
	{
		return null;
	}

	const items = [];
	let cursor = index + 1;

	while (cursor < tokens.length && tokens[cursor].value !== ']')
	{
		const token = tokens[cursor];

		if (token.type !== 'string')
		{
			cursor += 1;
			continue;
		}

		if (tokens[cursor + 1]?.value === '=>' && tokens[cursor + 2]?.value === '[')
		{
			const nested = parseArray(tokens, cursor + 2);
			if (nested === null)
			{
				cursor += 1;
				continue;
			}

			items.push({ key: token.value, token, array: nested });
			cursor = nested.next;
			continue;
		}

		items.push({ value: token.value, token });
		cursor += 1;
	}

	return {
		items,
		start: tokens[index].start,
		end: tokens[cursor]?.end ?? tokens[tokens.length - 1].end,
		next: cursor + 1,
	};
}

/** Index of the first top-level `[` token, that is the array the file returns. */
export function findRootArray(tokens)
{
	const index = tokens.findIndex(token => token.value === '[');

	return index === -1 ? null : parseArray(tokens, index);
}
