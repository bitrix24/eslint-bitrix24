import { type Options, type Result } from './types';

export function isEmpty(value: unknown): boolean
{
	return value === [] || value === {};
}

export function check(options: Options): Result
{
	if (!options)
	{
		new Error('No options');
	}

	return options.result;
}
