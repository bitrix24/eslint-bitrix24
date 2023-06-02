export class MyClass
{
	constructor()
	{
		this.prop = 1;
	}

	foo(): number
	{
		if (window.xxx)
		{
			return window.xxx;
		}

		if (BX.MyClass)
		{
			return 1;
		}

		return this.prop;
	}

	show(): number
	{
		return 2;
	}
}
