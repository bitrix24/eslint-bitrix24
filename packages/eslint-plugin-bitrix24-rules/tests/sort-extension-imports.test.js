const { RuleTester } = require('eslint');
const rule = require('../rules/sort-extension-imports');

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

ruleTester.run('sort-extension-imports', rule, {
	valid: [
		{
			code: `
import { Type, type JsonObject } from 'main.core';
import { isResizableImage, resizeImage } from 'ui.uploader.core';

import 'calendar.sliderloader';

import { Logger } from 'im.v2.lib.logger';
import { getChatRoleForUser } from 'im.v2.lib.role-manager';
import { Notifier } from 'im.v2.lib.notifier';

import { DomUtil } from './dom';

import { type Store } from 'ui.vue3.vuex';
import {
  type RestUpdateChatConfig,
  type UpdateChatConfig,
  type UpdateCollabConfig,
  type GetMemberEntitiesConfig,
} from '../types/chat';

import './css/description-banner.css';
      `.trim(),
			filename: 'im/install/js/im/v2/provider/service/chat/src/classes/update.js'
		},
		{
			code: `
import { Type } from 'main.core';

import { Logger } from 'calendar.lib.logger';

import { DomUtil } from './dom';
      `.trim(),
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
      `.trim(),
			filename: 'test/src/file.js'
		},
		{
			code: `
import { Type, type JsonObject } from 'main.core';
      `.trim(),
			filename: 'test/src/file.js'
		},
		{
			code: `
import { type TextEditor } from '../../text-editor';
import { type SchemeValidationOptions } from '../../types/scheme-validation-options';
      `.trim(),
			filename: 'test/src/file.js'
		},
		{
			code: `
import { Type } from 'main.core';

import { type Store } from 'ui.vue3.vuex';
      `.trim(),
			filename: 'test/src/file.js'
		},
		{
			code: `
import { Type } from 'main.core';
import { External } from 'calendar.sliderloader';
import { Logger } from 'im.v2.lib.logger';
import { DomUtil } from './dom';
import './css/style.css';
      `.trim(),
			filename: 'im/install/js/im/v2/test.js',
			options: [{ 'optional-newlines-for-single-imports': true }]
		},
		{
			code: `
import { Type } from 'main.core';

import { External } from 'calendar.sliderloader';

import { Logger } from 'im.v2.lib.logger';

import { DomUtil } from './dom';

import './css/style.css';
      `.trim(),
			filename: 'im/install/js/im/v2/test.js',
			options: [{ 'optional-newlines-for-single-imports': true }]
		},
		{
			code: `
import { Type } from 'main.core';

import { External } from 'calendar.sliderloader';
import { Logger } from 'im.v2.lib.logger';

import { DomUtil } from './dom';
import './css/style.css';
      `.trim(),
			filename: 'im/install/js/im/v2/test.js',
			options: [{ 'optional-newlines-for-single-imports': true }]
		},
		{
			code: `
import { Type } from 'main.core';
import { Component } from 'ui.component';

import { External } from 'calendar.sliderloader';
      `.trim(),
			filename: 'test/src/file.js',
			options: [{ 'optional-newlines-for-single-imports': true }]
		}
	],

	invalid: [
		{
			code: `
import { Logger } from 'im.v2.lib.logger';
import { Type } from 'main.core';
      `.trim(),
			output: `
import { Type } from 'main.core';

import { Logger } from 'im.v2.lib.logger';
      `.trim(),
			filename: 'im/install/js/im/v2/test.js',
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
      `.trim(),
			output: `
import { Type } from 'main.core';

import { DomUtil } from './dom';
      `.trim(),
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
      `.trim(),
			output: `
import { Type } from 'main.core';

import './css/style.css';
      `.trim(),
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
      `.trim(),
			output: `
import { Type } from 'main.core';

import { External } from 'calendar.sliderloader';
      `.trim(),
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
import { External } from 'calendar.sliderloader';
import { Logger } from 'im.v2.lib.logger';
      `.trim(),
			output: `
import { Type } from 'main.core';

import { External } from 'calendar.sliderloader';

import { Logger } from 'im.v2.lib.logger';
      `.trim(),
			filename: 'im/install/js/im/v2/test.js',
			errors: 2
		},
		{
			code: `
import { type Store } from 'ui.vue3.vuex';
import { Type } from 'main.core';
      `.trim(),
			output: `
import { Type } from 'main.core';

import { type Store } from 'ui.vue3.vuex';
      `.trim(),
			filename: 'im/install/js/im/v2/test.js',
			errors: [
				{
					message: /Imports are not properly sorted/
				}
			]
		},
		{
			code: `
import type { Store } from 'ui.vue3.vuex';
      `.trim(),
			output: `
import { type Store } from 'ui.vue3.vuex';
      `.trim(),
			filename: 'im/install/js/im/v2/test.js',
			errors: [
				{
					message: /Use inline type syntax/
				}
			]
		},
		{
			code: `
import { Type } from 'main.core';
import { isResizableImage } from 'ui.uploader.core';
import { External } from 'calendar.sliderloader';
      `.trim(),
			output: `
import { Type } from 'main.core';
import { isResizableImage } from 'ui.uploader.core';

import { External } from 'calendar.sliderloader';
      `.trim(),
			filename: 'im/install/js/im/v2/test.js',
			errors: [
				{
					message: /Expected blank line between 'main-ui-legacy' and 'external' imports/
				}
			]
		},
		{
			code: `
import 'legacy_ext';

import { Type } from 'main.core';
      `.trim(),
			output: `
import 'legacy_ext';
import { Type } from 'main.core';
      `.trim(),
			filename: 'im/install/js/im/v2/test.js',
			errors: [
				{
					message: /Unexpected blank line between 'main-ui-legacy' imports/
				}
			]
		},
		{
			code: `
import { Type } from 'main.core';

import type { JsonObject } from 'main.core';
      `.trim(),
			output: `
import { Type, type JsonObject } from 'main.core';
      `.trim(),
			filename: 'im/install/js/im/v2/test.js',
			errors: [
				{
					message: /Use inline type syntax/
				}
			]
		},
		{
			code: `
import { Type } from 'main.core';
import { Component } from 'ui.component';
import { External } from 'calendar.sliderloader';
      `.trim(),
			output: `
import { Type } from 'main.core';
import { Component } from 'ui.component';

import { External } from 'calendar.sliderloader';
      `.trim(),
			filename: 'test/src/file.js',
			options: [{ 'optional-newlines-for-single-imports': true }],
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
      `.trim(),
			output: `
import { Type } from 'main.core';

import { DomUtil } from './dom';

import './style.css';
      `.trim(),
			filename: 'im/install/js/im/v2/test.js',
			errors: [
				{
					message: /Imports are not properly sorted/
				}
			]
		},
		{
			code: `
import type { User, Role } from 'main.core';
      `.trim(),
			output: `
import { type User, type Role } from 'main.core';
      `.trim(),
			filename: 'im/install/js/im/v2/test.js',
			errors: [
				{
					message: /Use inline type syntax/
				}
			]
		},
		{
			code: `
import { Helper } from './helper';
import type { Config } from './helper';
      `.trim(),
			output: `
import { Helper, type Config } from './helper';
      `.trim(),
			filename: 'im/install/js/im/v2/test.js',
			errors: [
				{
					message: /Use inline type syntax/
				}
			]
		}
	]
});

console.log('All tests passed!');
