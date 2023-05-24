// @vue/component
export const VueComponent = {
	name: 'XXX',
	data(): Object
	{
		return {
			name: 'a',
			items: {
				b: 1,
				c: 2,
			},
		};
	},

	// language=Vue
	template: `
		<div class="test" v-if="items['b'] == 1">
			<div a="1" b="2" c="3" d="4"></div>
		</div>
	`,

};
