// Disallows the syntax the options name by selectors.
//
// Options: selectors, each either a string or `{ selector, message }`.

export default {
	meta: {
		type: 'suggestion',
		docs: { description: 'Disallow specified syntax' },
		schema: {
			type: 'array',
			items: {
				oneOf: [
					{ type: 'string' },
					{
						type: 'object',
						properties: {
							selector: { type: 'string' },
							message: { type: 'string' },
						},
						required: ['selector'],
						additionalProperties: false,
					},
				],
			},
			uniqueItems: true,
			minItems: 0,
		},
		messages: {
			restrictedSyntax: '{{message}}',
		},
	},
	create(context)
	{
		const visitor = {};
		for (const option of context.options)
		{
			const selector = typeof option === 'string' ? option : option.selector;
			const message = typeof option === 'string' || !option.message
				? `Using '${selector}' is not allowed.`
				: option.message;

			const previous = visitor[selector];
			visitor[selector] = (node) => {
				previous?.(node);
				context.report({ node, messageId: 'restrictedSyntax', data: { message } });
			};
		}

		return visitor;
	},
};
