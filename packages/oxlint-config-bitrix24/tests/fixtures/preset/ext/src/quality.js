export function first(items)
{
	const result = [];
	result.push(items.length);
	result.push(items.at(0));

	return result;
}

export function second(items)
{
	const result = [];
	result.push(items.length);
	result.push(items.at(0));

	return result;
}

function log(value)
{
	console.info(value);
}

export function check(object)
{
	for (const key in object)
	{
		if (Object.hasOwn(object, key))
		{
			log(key, object[key]);
		}
	}

	const logged = log(object);

	return function() {
		return [this, logged];
	};
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function complex(a, b, c)
{
	if (a)
	{
		if (b)
		{
			if (c)
			{
				for (const x of a)
				{
					if (x && b || c)
					{
						return x;
					}
				}
			}
		}
	}

	return null;
}
