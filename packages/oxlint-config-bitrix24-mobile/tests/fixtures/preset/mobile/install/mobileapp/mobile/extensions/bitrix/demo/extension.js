/**
 * @module demo
 */
jn.define('demo', (require, exports, module) => {
	const { Alert } = jn.require('alert');

	class Demo extends LayoutComponent
	{
		render()
		{
			BX.ajax();

			return View({}, Text({ text: Alert.name }));
		}
	}

	module.exports = { Demo };
});
