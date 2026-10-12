import { jsPlugins, mobile } from './overrides.js';

// Extend it after @bitrix24/oxlint-config-bitrix24:
//   extends: [bitrix24, bitrix24Mobile]
export default {
	jsPlugins,
	overrides: [mobile],
};
