# @bitrix24/eslint-plugin-bitrix24-janative

Custom ESLint rules for Bitrix24 JaNative (mobile) development.

Compatible with ESLint 8 and ESLint 9.

## Installation

```bash
npm install --save-dev @bitrix24/eslint-plugin-bitrix24-janative
```

This plugin is included automatically when using [@bitrix24/eslint-config-bitrix24-mobile](https://github.com/bitrix24/eslint-bitrix24/tree/main/packages/eslint-config-bitrix24-mobile). Manual installation is only needed if you want to use the rules independently.

## Rules

| Rule | Level in the mobile preset | Description |
|------|------|-------------|
| `deps-unresolved-require` | error | The required path does not exist: nothing declares it with `jn.define()` |
| `deps-missing-entry` | error | The dependency is used but not listed in `deps.php` |
| `deps-external-bundle` | error | The required file is a bundle file of another extension |
| `deps-unused-entry` | error | `deps.php` lists a path nothing in the extension uses |
| `deps-non-canonical-require` | error | The path is not the name the target file declares |
| `no-global-require` | error | Disallow top-level `require()` calls outside of `jn.define()` |
| `no-static-variable-in-class` | off | Disallow static variable declarations in classes |

A repository that has not been through `janative-deps sync` yet will fail on the entries it
accumulated before the rules existed. Run `janative-deps sync` once over the mobileapp tree
and commit the result before turning the preset on.

### How the dependency rules read the code

A dependency is a `require()` call with a string literal, or an `@deps path` annotation in a
comment. `jn.require()` counts the same: it is the global form, used by the code living
outside a `jn.define()`. A template string cannot be read — that is what `@deps` exists for.
`requireLazy()` and `jn.import()` are lazy loading, never a dependency of the file, and never
go into `deps.php`. Paths starting with `native/` are outside the project and are not looked
for.

The source is parsed rather than searched through as text, so a call split across lines is
still a call and the same words inside a template string are not. A file that does not parse
falls back to a text scan rather than being skipped.

An extension asking for its own name depends on nothing, so no entry is expected for it. When
two files of the repository declare the same name, the one inside the extension asking for it
wins over the namesake.

The checks form a chain, so a single request produces a single verdict: an unresolved path
says nothing about `deps.php`, and a bundle file of another extension is reported as such
rather than as a missing entry.

`deps-unused-entry` judges the extension as a whole and reports once, at its entry point
(`extension.js` or `component.js`): a path unused by one file may well be used by its
neighbour. An entry marked `// @keep` on its line is never reported. An extension that calls
`requireLazy()` keeps `require-lazy` in `deps.php` without ever requiring it.

An entry is never called unused while the code asks for it, whatever else is wrong with the
request — an unresolved path, a bundle file of a neighbour, a native module. Those have rules
of their own, and removing the entry as well would take out a line the build needs.

## Command

```bash
npx janative-deps check [path...]     # report what does not match deps.php
npx janative-deps sync  [path...]     # write deps.php to match the code
```

`check` is what the rules report, applied to whole directories rather than a single file.
Every finding is an error and exits with `1`, matching the preset where every rule is an
error — a commit the rules would fail must not slip through the command either. It also
catches what the rules cannot: a commit that touches `deps.php` alone, without any
JavaScript for ESLint to look at, and an entry listed more than once.

`sync` writes the file. Missing dependencies are added in the canonical section order
(`components` → `extensions` → `bundle`), unused entries are removed except the ones marked
`@keep`, repeat listings of the same entry are collapsed into the first one, a flat file
without sections stays flat, and a file left with nothing to list is deleted. Formatting,
quote style, comments and line endings of an existing file are preserved: entries are
inserted and removed as point edits, not by rewriting the file.

| Option | Meaning |
|--------|---------|
| `--dry-run` | with `sync`, report the changes without writing them |
| `--quiet` | report only the summary |
| `-h`, `--help` | show usage |

Paths default to the current directory. Pointing the command at a repository root visits every
extension of the mobileapp tree.

## License

MIT
