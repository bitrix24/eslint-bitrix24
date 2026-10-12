export function sum(items)
{
	let total = 0;
	for (let i = 0; i < items.length; i++)
	{
		total += items[i];
	}

	const some_total = total; // eslint-disable-line camelcase
	const other_total = some_total;

	return other_total + window.config['value'];
}
