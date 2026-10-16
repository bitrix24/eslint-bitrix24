// Disallows two branches of an `if` chain or two cases of a `switch` with the same code.
//
// A branch is reported when it spans more than one line and repeats an earlier branch.
// Without a final `else` or `default`, branches that are all the same are reported
// whatever their size: the condition does not matter then.
// Branches are compared token by token; a trailing `break` of a case is not compared.

import { areEquivalent } from './helpers.js';

// statements of a case: the contents of a single block, without a trailing `break`
function caseBody(switchCase)
{
	let statements = switchCase.consequent;
	if (statements.length === 1 && statements[0].type === 'BlockStatement')
	{
		statements = statements[0].body;
	}

	return statements.at(-1)?.type === 'BreakStatement' ? statements.slice(0, -1) : statements;
}

export default {
	meta: {
		type: 'problem',
		docs: { description: 'Two branches in a conditional structure should not have exactly the same implementation' },
		schema: [],
		messages: {
			sameConditionalBlock: "This {{type}}'s code block is the same as the block for the {{type}} on line {{line}}.",
		},
	},
	create(context)
	{
		const sourceCode = context.sourceCode;

		const report = (node, original, type) => {
			context.report({
				node,
				messageId: 'sameConditionalBlock',
				data: { type, line: String(original.loc.start.line) },
			});
		};

		const spansLines = (nodes) => {
			if (nodes.length === 0)
			{
				return false;
			}

			const tokens = [...sourceCode.getTokens(nodes[0]), ...sourceCode.getTokens(nodes.at(-1))]
				.filter((token) => token.value !== '{' && token.value !== '}');

			return tokens.length > 0 && tokens.at(-1).loc.end.line > tokens[0].loc.start.line;
		};

		const allEquivalent = (branches) => branches.length > 1
			&& branches.slice(1).every((branch, index) => areEquivalent(branch, branches[index], sourceCode));

		return {
			IfStatement(node)
			{
				if (node.parent.type === 'IfStatement')
				{
					return;
				}

				const branches = [node.consequent];
				let endsWithElse = false;
				for (let statement = node.alternate; statement; statement = statement.alternate)
				{
					if (statement.type !== 'IfStatement')
					{
						branches.push(statement);
						endsWithElse = true;
						break;
					}

					branches.push(statement.consequent);
				}

				if (!endsWithElse && allEquivalent(branches))
				{
					branches.slice(1).forEach((branch, index) => report(branch, branches[index], 'branch'));

					return;
				}

				for (const [index, branch] of branches.entries())
				{
					if (index === 0 || !spansLines([branch]))
					{
						continue;
					}

					const original = branches.slice(0, index).find((candidate) => areEquivalent(branch, candidate, sourceCode));
					if (original)
					{
						report(branch, original, 'branch');
					}
				}
			},

			SwitchStatement(node)
			{
				const cases = node.cases;
				const endsWithDefault = cases.some((switchCase) => switchCase.test === null);
				const nonEmptyCases = cases.filter((switchCase) => caseBody(switchCase).length > 0);

				if (!endsWithDefault && allEquivalent(nonEmptyCases.map(caseBody)))
				{
					nonEmptyCases.slice(1).forEach((switchCase, index) => report(switchCase, nonEmptyCases[index], 'case'));

					return;
				}

				for (const [index, switchCase] of cases.entries())
				{
					const body = caseBody(switchCase);
					if (index === 0 || !spansLines(body))
					{
						continue;
					}

					const original = cases.slice(0, index).find((candidate) => areEquivalent(body, caseBody(candidate), sourceCode));
					if (original)
					{
						report(switchCase, original, 'case');
					}
				}
			},
		};
	},
};
