const { RuleTester } = require('eslint');
const rule = require('../rules/sort-imports');

const ruleTester = new RuleTester({
	parser: require.resolve('@babel/eslint-parser'),
	parserOptions: {
		ecmaVersion: 2015,
		sourceType: 'module',
		requireConfigFile: false,
		babelOptions: {
			parserOpts: {
				plugins: ['flow']
			}
		}
	}
});

ruleTester.run('sort-imports', rule, {
	valid: [
		{
			code: `
import { Type, type JsonObject } from 'main.core';
import { isResizableImage, resizeImage } from 'ui.uploader.core';

import 'calendar.sliderloader';

import { Logger } from 'im.v2.lib.logger';
import { getChatRoleForUser } from 'im.v2.lib.role-manager';
import { Notifier } from 'im.v2.lib.notifier';
import { type ChatOptions } from 'im.v2.chat';

import { DomUtil } from './dom';
import {
  type RestUpdateChatConfig,
  type UpdateChatConfig,
  type UpdateCollabConfig,
  type GetMemberEntitiesConfig,
} from '../types/chat';

import './css/description-banner.css';
`,
			filename: 'im/install/js/im/v2/provider/service/chat/src/classes/update.js'
		},
		{
			code: `
import { Type } from 'main.core';

import { Logger } from 'calendar.lib.logger';

import { DomUtil } from './dom';
`,
			filename: 'im/install/js/im/v2/test.js'
		},
		{
			code: `
import { Component } from 'ui.component';
import 'legacy_module';

import { External } from 'external.module';

import { Local } from './local';
import { type Something } from './types';

import './style.css';
`,
			filename: 'test/src/file.js'
		},
		{
			code: `
import { Type, type JsonObject } from 'main.core';
`,
			filename: 'test/src/file.js'
		},
		{
			code: `
import { Type } from 'main.core';
import { type Store } from 'ui.vue3.vuex';
`,
			filename: 'test/src/file.js'
		},
		{
			code: `
import { Type } from 'main.core';
import { External } from 'calendar.sliderloader';
import { Logger } from 'im.v2.lib.logger';
import { DomUtil } from './dom';
import './css/style.css';
`,
			filename: 'im/install/js/im/v2/test.js'
		},
		{
			code: `
import { Type } from 'main.core';

import { External } from 'calendar.sliderloader';

import { Logger } from 'im.v2.lib.logger';

import { DomUtil } from './dom';

import './css/style.css';
`,
			filename: 'im/install/js/im/v2/test.js'
		},
		{
			code: `
import { Type } from 'main.core';

import { External } from 'calendar.sliderloader';
import { Logger } from 'im.v2.lib.logger';

import { DomUtil } from './dom';
import './css/style.css';
`,
			filename: 'im/install/js/im/v2/test.js'
		},
		{
			code: `
import { Type } from 'main.core';
import { Component } from 'ui.component';

import { External } from 'calendar.sliderloader';
`,
			filename: 'test/src/file.js'
		},
		{
			code: `
import { Type } from 'main.core';
import { isResizableImage } from 'ui.uploader.core';
import { External } from 'calendar.sliderloader';
`,
			filename: 'im/install/js/im/v2/test.js'
		},
		{
			code: `
import { Type } from 'main.core';
import { External } from 'calendar.sliderloader';
import { Logger } from 'im.v2.lib.logger';
`,
			filename: 'im/install/js/im/v2/test.js'
		},
		{
			code: `
import 'legacy_ext';

import { Type } from 'main.core';
`,
			filename: 'im/install/js/im/v2/test.js'
		}
	],

	invalid: [
		{
			code: `
import { Logger } from 'im.v2.lib.logger';
import { Type } from 'main.core';
`,
			output: `
import { Type } from 'main.core';

import { Logger } from 'im.v2.lib.logger';
`,
			filename: 'im/install/js/im/v2/test.js',
			errors: [
				{
					message: /Imports are not properly sorted/
				}
			]
		},
		{
			code: `
import { Local } from './local';
import { Type } from 'main.core';
import { type Cache } from 'main.core.cache';

export type Foo = {};

import './style.css';
`,
			output: `
import { Type } from 'main.core';
import { type Cache } from 'main.core.cache';

import { Local } from './local';

import './style.css';

export type Foo = {};
`,
			filename: 'test/src/file.js',
			errors: [
				{
					message: /Imports are not properly sorted/
				}
			]
		},
		{
			code: `
import { DomUtil } from './dom';
import { Type } from 'main.core';
`,
			output: `
import { Type } from 'main.core';

import { DomUtil } from './dom';
`,
			filename: 'im/install/js/im/v2/test.js',
			errors: [
				{
					message: /Imports are not properly sorted/
				}
			]
		},
		{
			code: `
import './css/style.css';
import { Type } from 'main.core';
`,
			output: `
import { Type } from 'main.core';

import './css/style.css';
`,
			filename: 'im/install/js/im/v2/test.js',
			errors: [
				{
					message: /Imports are not properly sorted/
				}
			]
		},
		{
			code: `
import { External } from 'calendar.sliderloader';
import { Type } from 'main.core';
`,
			output: `
import { Type } from 'main.core';

import { External } from 'calendar.sliderloader';
`,
			filename: 'im/install/js/im/v2/test.js',
			errors: [
				{
					message: /Imports are not properly sorted/
				}
			]
		},
		{
			code: `
import { Type } from 'main.core';
import { isResizableImage } from 'ui.uploader.core';
import { External } from 'calendar.sliderloader';
import { Helper } from 'external.helper';
`,
			output: `
import { Type } from 'main.core';
import { isResizableImage } from 'ui.uploader.core';

import { External } from 'calendar.sliderloader';
import { Helper } from 'external.helper';
`,
			filename: 'im/install/js/im/v2/test.js',
			errors: [
				{
					message: /Expected blank line between 'main-ui-legacy' and 'external' imports/
				}
			]
		},
		{
			code: `
import { DomUtil } from './dom';
import './style.css';
import { Type } from 'main.core';
`,
			output: `
import { Type } from 'main.core';

import { DomUtil } from './dom';

import './style.css';
`,
			filename: 'im/install/js/im/v2/test.js',
			errors: [
				{
					message: /Imports are not properly sorted/
				}
			]
		}
	]
});

console.log('All tests passed!');
