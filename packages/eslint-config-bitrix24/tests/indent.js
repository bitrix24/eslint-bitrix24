const a = 3;
if (a > 0)
{
	const b = a;

	foo(b);
}

function foo(d): number
{
	const c = d + 1;

	if (c === 2)
	{
		return 2;
	}

	return c;
}

class C
{
	static boo(): void
	{
		foo();

		const fn = function(): number
		{
			return 1;
		};

		const fn2 = (): number => {
			return 1;
		};

		fn();
		fn2();
	}

	xx(): boolean
	{
		return this.a;
	}
}

new C();
