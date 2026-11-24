// Writes the SDK's theme variables (`src/styling/light.scss` and `dark.scss`) from the web Chat
// build of design-system-tokens (`build/web/chat/<theme>.scss`).
//
//   yarn sync-design-tokens <path to a design-system-tokens checkout>
//
// The SDK's `--str-chat__*` variables are its public theming API, so the sync keeps their names:
// - a variable with a token of the same name gets that token's definition;
// - a variable whose token was renamed or removed gets the definition `design-tokens-mapping.mts`
//   names for it;
// - a token joins only when an SDK variable reads it through its `var()` chain, or when
//   `ADOPTED_TOKENS` lists it.
// The sync fails instead of guessing: on an SDK variable with no token and no mapping, on a mapped
// name that is a token again, and on a `var()` reference to a token the build does not have.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as prettier from 'prettier';

import {
  ADOPTED_TOKENS,
  DEFINITION_PER_THEME,
  TAKES_DEFINITION_OF,
} from './design-tokens-mapping.mts';

const PREFIX = '--str-chat__';
const THEMES = ['light', 'dark'] as const;
type Theme = (typeof THEMES)[number];

/** One declaration of a generated file: its name (without the prefix), value and comments. */
type Declaration = {
  comment: string[];
  name: string;
  trailingComment: string;
  value: string;
};

const root = resolve(import.meta.dirname, '..');
const tokensRepo = process.argv[2];

if (!tokensRepo) {
  console.error(
    'Usage: yarn sync-design-tokens <path to a design-system-tokens checkout>',
  );
  process.exit(1);
}

const declarationLine = /^\s*--str-chat__([\w-]+)\s*:\s*(.+?);\s*(\/\*\*.*\*\/)?\s*$/;
const referencedNames = (value: string) =>
  [...value.matchAll(/var\(\s*--str-chat__([\w-]+)/g)].map(([, name]) => name);

/**
 * Reads a Style Dictionary `css/variables` file: one declaration per line, each optionally
 * preceded by an indented block comment. The file's own header comment is not indented.
 */
const parseDeclarations = (source: string): Declaration[] => {
  const declarations: Declaration[] = [];
  let pendingComment: string[] = [];
  let inComment = false;

  for (const line of source.split('\n')) {
    if (inComment || line.startsWith('  /*')) {
      pendingComment.push(line);
      inComment = !line.includes('*/');
      continue;
    }
    const match = line.match(declarationLine);
    if (!match) continue;
    const [, name, value, trailingComment = ''] = match;
    declarations.push({ comment: pendingComment, name, trailingComment, value });
    pendingComment = [];
  }

  return declarations;
};

const readTokens = (theme: Theme) =>
  parseDeclarations(
    readFileSync(resolve(tokensRepo, `build/web/chat/${theme}.scss`), 'utf8'),
  );

/** The SDK's variables: every name the generated files declare now, plus the adopted tokens. */
const readSdkVariableNames = () => {
  const names = new Set(ADOPTED_TOKENS);
  for (const theme of THEMES) {
    const source = readFileSync(resolve(root, `src/styling/${theme}.scss`), 'utf8');
    for (const [, name] of source.matchAll(/--str-chat__([\w-]+)\s*:/g)) names.add(name);
  }
  return names;
};

const tokens = { dark: readTokens('dark'), light: readTokens('light') };
const tokenByName = Object.fromEntries(
  THEMES.map((theme) => [
    theme,
    new Map(tokens[theme].map((token) => [token.name, token])),
  ]),
) as Record<Theme, Map<string, Declaration>>;
const isToken = (name: string) => THEMES.some((theme) => tokenByName[theme].has(name));

const isMapped = (name: string) =>
  name in TAKES_DEFINITION_OF || name in DEFINITION_PER_THEME;

const assertMappingStillNeeded = () => {
  for (const name of [
    ...Object.keys(TAKES_DEFINITION_OF),
    ...Object.keys(DEFINITION_PER_THEME),
  ]) {
    if (isToken(name)) {
      throw new Error(
        `${PREFIX}${name} is a token again: remove it from scripts/design-tokens-mapping.mts`,
      );
    }
  }
  for (const [name, target] of Object.entries(TAKES_DEFINITION_OF)) {
    if (!tokenByName.light.has(target)) {
      throw new Error(
        `${PREFIX}${name} takes the definition of ${target}, which is not a token`,
      );
    }
  }
};

/** The SDK variables plus every token their `var()` chains read, in both themes. */
const resolveEmittedNames = (sdkNames: Set<string>) => {
  const emitted = new Set<string>();
  const pending = [...sdkNames];

  const definitionsOf = (name: string): string[] => {
    if (name in DEFINITION_PER_THEME) return Object.values(DEFINITION_PER_THEME[name]);
    const source = TAKES_DEFINITION_OF[name] ?? name;
    return THEMES.flatMap((theme) => tokenByName[theme].get(source)?.value ?? []);
  };

  while (pending.length) {
    const name = pending.pop() as string;
    if (emitted.has(name)) continue;
    if (!isMapped(name) && !tokenByName.light.has(name)) {
      throw new Error(
        `${PREFIX}${name} has no token: map it in scripts/design-tokens-mapping.mts`,
      );
    }
    emitted.add(name);
    for (const value of definitionsOf(name)) pending.push(...referencedNames(value));
  }

  return emitted;
};

const formatDeclaration = ({ comment, name, trailingComment, value }: Declaration) => [
  ...comment,
  `  ${PREFIX}${name}: ${value};${trailingComment ? ` ${trailingComment}` : ''}`,
];

/** A theme's declarations, in the build's order, each mapped name after the token it copies. */
const themeDeclarations = (theme: Theme, emitted: Set<string>) => {
  const lines: string[] = [];
  for (const token of tokens[theme]) {
    if (emitted.has(token.name)) lines.push(...formatDeclaration(token));
    for (const [name, target] of Object.entries(TAKES_DEFINITION_OF)) {
      if (target === token.name && emitted.has(name)) {
        lines.push(...formatDeclaration({ ...token, comment: [], name }));
      }
    }
  }
  for (const [name, definition] of Object.entries(DEFINITION_PER_THEME)) {
    if (emitted.has(name)) {
      lines.push(
        ...formatDeclaration({
          comment: [],
          name,
          trailingComment: '',
          value: definition[theme],
        }),
      );
    }
  }
  return lines;
};

const tokensCommit = () => {
  try {
    return execFileSync('git', ['-C', tokensRepo, 'rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'unknown commit';
  }
};

const writeTheme = async (theme: Theme, emitted: Set<string>, commit: string) => {
  const path = resolve(root, `src/styling/${theme}.scss`);
  const source = [
    '/**',
    ' * Do not edit directly: written by `yarn sync-design-tokens` from design-system-tokens',
    ` * build/web/chat/${theme}.scss (${commit}).`,
    ' */',
    '',
    '@mixin variables {',
    ...themeDeclarations(theme, emitted),
    '}',
    '',
  ].join('\n');
  const options = await prettier.resolveConfig(path);
  writeFileSync(path, await prettier.format(source, { ...options, filepath: path }));
};

assertMappingStillNeeded();
const sdkNames = readSdkVariableNames();
const emitted = resolveEmittedNames(sdkNames);
const commit = tokensCommit();
for (const theme of THEMES) await writeTheme(theme, emitted, commit);

const addedFromChains = [...emitted].filter((name) => !sdkNames.has(name));
const leftOut = tokens.light.map(({ name }) => name).filter((name) => !emitted.has(name));
console.log(`Wrote ${emitted.size} variables from design-system-tokens ${commit}.`);
if (addedFromChains.length)
  console.log(`Added, read by SDK variables: ${addedFromChains.join(', ')}`);
if (leftOut.length)
  console.log(`Tokens left out (${leftOut.length}): ${leftOut.join(', ')}`);
