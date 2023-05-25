/**
 * @module crm/entity-detail/toolbar/content
 */
jn.define('crm/entity-detail/toolbar/content', (require, exports, module) => {
	const { TemplateFactory } = require('crm/entity-detail/toolbar/content/factory');
	const { EventEmitter } = require('event-emitter');

	class ToolbarContent extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.state = {
				loaded: false,
				templateName: null,
				templateData: {},
			};

			this.customEventEmitter = EventEmitter.createWithUid(this.detailCardUid);
		}

		get topPaddingRef()
		{
			return BX.prop.get(this.props.detailCard, 'topPaddingRef', null);
		}

		componentDidMount()
		{
			this.customEventEmitter.on('Crm.Timeline::onTimelineRefresh', this.handleHide);
		}

		/**
		 * @public
		 * @param {string} template
		 * @param {object} data
		 * @return {Promise}
		 */
		show(template, data = {})
		{
			return true;
		}

		/**
		 * @public
		 */
		hide(): boolean
		{
			return true;
		}

		render()
		{
			const { loaded, templateName, templateData } = this.state;
			const { style, animation } = this.props;

			return View(
				{
					style: {
						flex: 1,
					},
					clickable: false,
				},
				loaded && TemplateFactory.make(templateName, {
					style,
					animation,
					...templateData,
					onHide: this.handleHide,
				}),
			);
		}
	}

	module.exports = { ToolbarContent };
});
