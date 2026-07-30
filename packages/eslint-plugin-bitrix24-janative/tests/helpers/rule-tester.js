import { RuleTester } from 'eslint';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

/** Fixture repository with a real mobileapp layout: the rules read it from disk. */
export const FIXTURE_ROOT = fileURLToPath(new URL('../fixtures/repo', import.meta.url));

const APP = `${FIXTURE_ROOT}/tasksmobile/install/mobileapp/tasksmobile`;

export const FILES = {
	dashboard: `${APP}/extensions/tasks/dashboard/extension.js`,
	dashboardHelper: `${APP}/extensions/tasks/dashboard/src/helper.js`,
	task: `${APP}/extensions/tasks/task/extension.js`,
	list: `${APP}/components/tasks/tasks.list/component.js`,
	outside: `${FIXTURE_ROOT}/tasksmobile/install/js/tasks/entry.js`,
};

export function createRuleTester()
{
	return new RuleTester({
		parser: require.resolve('@babel/eslint-parser'),
		parserOptions: {
			ecmaVersion: 2022,
			sourceType: 'script',
			requireConfigFile: false,
			babelOptions: {
				parserOpts: {
					plugins: ['flow'],
				},
			},
		},
	});
}
