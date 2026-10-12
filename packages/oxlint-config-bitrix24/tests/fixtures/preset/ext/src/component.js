import { BitrixVue } from 'ui.vue3';

BitrixVue.component('ui-counter', {
	data()
	{
		return { count: 0 };
	},
	props: ['value'],
	template: '<div>{{ count }}</div>',
});
