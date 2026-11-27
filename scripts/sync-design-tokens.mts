// Writes the SDK's theme variables (`src/styling/light.scss` and `dark.scss`) from the web Chat
// build of design-system-tokens (`build/web/chat/<theme>.scss`).
//
//   yarn sync-design-tokens <path to a design-system-tokens checkout>
//
// The SDK's `--str-chat__*` variables are its public theming API, so the sync keeps their names:
// - a variable with a token of the same name gets that token's definition;
// - a variable whose token was renamed or removed, or whose definition the SDK keeps, gets the
//   definition `design-tokens-mapping.mts` gives it;
// - a definition that reads a renamed token reads the SDK name for it instead;
// - a token joins only when an SDK variable reads it through its `var()` chain, or when
//   `ADOPTED_TOKENS` lists it.
// The sync fails instead of guessing: on an SDK variable with no token and no mapping, on a mapped
// name that is a token again, on a `var()` reference to a token the build does not have, and when
// an SDK variable would read different SDK variables than the generated files read now.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as prettier from 'prettier';

import {
  ADOPTED_TOKENS,
  ALLOWED_READ_CHANGES,
  SDK_DEFINITIONS,
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
const referencePattern = /var\(\s*--str-chat__([\w-]+)/g;
const readsOf = (value: string) =>
  new Set([...value.matchAll(referencePattern)].map(([, name]) => name));

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

/** Each variable's value in a generated SDK file, which prettier may spread over lines. */
const parseGeneratedValues = (source: string) => {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
  return new Map(
    [...withoutComments.matchAll(/--str-chat__([\w-]+)\s*:\s*([^;]*);/g)].map(
      ([, name, value]) => [name, value.replace(/\s+/g, ' ').trim()],
    ),
  );
};

const readGenerated = () =>
  Object.fromEntries(
    THEMES.map((theme) => [
      theme,
      parseGeneratedValues(
        readFileSync(resolve(root, `src/styling/${theme}.scss`), 'utf8'),
      ),
    ]),
  ) as Record<Theme, Map<string, string>>;

const readTokens = (theme: Theme) =>
  parseDeclarations(
    readFileSync(resolve(tokensRepo, `build/web/chat/${theme}.scss`), 'utf8'),
  );

const tokens = { dark: readTokens('dark'), light: readTokens('light') };
const tokenByName = Object.fromEntries(
  THEMES.map((theme) => [
    theme,
    new Map(tokens[theme].map((token) => [token.name, token])),
  ]),
) as Record<Theme, Map<string, Declaration>>;
const isToken = (name: string) => THEMES.some((theme) => tokenByName[theme].has(name));

const previous = readGenerated();

/** The SDK's variables: every name the generated files declare now, plus the adopted tokens. */
const sdkNames = new Set([
  ...ADOPTED_TOKENS,
  ...THEMES.flatMap((theme) => [...previous[theme].keys()]),
]);

const isDefinedBySdk = (name: string) => name in SDK_DEFINITIONS;
const isMapped = (name: string) => name in TAKES_DEFINITION_OF || isDefinedBySdk(name);

const assertMappingStillNeeded = () => {
  for (const [name, target] of Object.entries(TAKES_DEFINITION_OF)) {
    if (isToken(name)) {
      throw new Error(
        `${PREFIX}${name} is a token again: remove it from TAKES_DEFINITION_OF in scripts/design-tokens-mapping.mts`,
      );
    }
    if (!tokenByName.light.has(target)) {
      throw new Error(
        `${PREFIX}${name} takes the definition of ${target}, which is not a token`,
      );
    }
    if (isDefinedBySdk(name)) {
      throw new Error(
        `${PREFIX}${name} is in both TAKES_DEFINITION_OF and SDK_DEFINITIONS: keep one`,
      );
    }
  }
};

/**
 * The SDK name to write for a token a definition reads: the token's own name when the SDK declares
 * it, otherwise the SDK variable that takes its definition (`message-bubble-text-incoming` is read
 * as `chat-text-incoming`). Other tokens keep their name and join through the `var()` chain.
 */
const sdkNameForToken = (() => {
  const renamed = new Map<string, string>();
  for (const [name, target] of Object.entries(TAKES_DEFINITION_OF)) {
    if (sdkNames.has(target)) continue;
    const other = renamed.get(target);
    if (other) {
      throw new Error(
        `${PREFIX}${name} and ${PREFIX}${other} both take the definition of ${target}: a definition that reads ${target} has no single SDK name`,
      );
    }
    renamed.set(target, name);
  }
  return (token: string) => renamed.get(token) ?? token;
})();

const renameReads = (value: string) =>
  value.replace(
    referencePattern,
    (_, token: string) => `var(${PREFIX}${sdkNameForToken(token)}`,
  );

/**
 * A variable's declaration in a theme, or undefined when that theme does not declare it (the
 * dark file declares only what differs from light).
 */
const declarationOf = (name: string, theme: Theme): Declaration | undefined => {
  const token = tokenByName[theme].get(TAKES_DEFINITION_OF[name] ?? name);
  if (isDefinedBySdk(name)) {
    const value = SDK_DEFINITIONS[name][theme];
    return value === undefined
      ? undefined
      : {
          comment: token?.comment ?? [],
          name,
          trailingComment: token?.trailingComment ?? '',
          value,
        };
  }
  return token && { ...token, name, value: renameReads(token.value) };
};

/** The SDK variables plus every token their `var()` chains read, in both themes. */
const resolveEmittedNames = () => {
  const emitted = new Set<string>();
  const pending = [...sdkNames];

  while (pending.length) {
    const name = pending.pop() as string;
    if (emitted.has(name)) continue;
    if (!isMapped(name) && !tokenByName.light.has(name)) {
      throw new Error(
        `${PREFIX}${name} has no token: map it in scripts/design-tokens-mapping.mts`,
      );
    }
    emitted.add(name);
    for (const theme of THEMES) {
      const declaration = declarationOf(name, theme);
      if (declaration) pending.push(...readsOf(declaration.value));
    }
  }

  return emitted;
};

/** A theme's declarations: in the build's order, each renamed variable after the token it copies. */
const themeDeclarations = (theme: Theme, emitted: Set<string>) => {
  const declarations: Declaration[] = [];
  const add = (name: string) => {
    const declaration = declarationOf(name, theme);
    if (declaration && emitted.has(name)) declarations.push(declaration);
  };
  for (const token of tokens[theme]) {
    add(token.name);
    for (const [name, target] of Object.entries(TAKES_DEFINITION_OF)) {
      if (target === token.name) add(name);
    }
  }
  for (const name of Object.keys(SDK_DEFINITIONS)) {
    if (!isToken(name)) add(name);
  }
  return declarations;
};

/** What a variable's definition reads in a theme; the dark file falls back to light. */
const readsInTheme = (
  values: Record<Theme, Map<string, string>>,
  name: string,
  theme: Theme,
) =>
  [...readsOf(values[theme].get(name) ?? values.light.get(name) ?? '')].sort().join(', ');

/**
 * Stops when an SDK variable would read different SDK variables than it does now. An integrator
 * who overrides the variable it read before would silently stop reaching it.
 */
const assertReadsUnchanged = (next: Record<Theme, Map<string, string>>) => {
  const changes: string[] = [];
  for (const name of previous.light.keys()) {
    if (ALLOWED_READ_CHANGES.includes(name)) continue;
    for (const theme of THEMES) {
      const before = readsInTheme(previous, name, theme);
      const after = readsInTheme(next, name, theme);
      if (before !== after) {
        changes.push(
          `  ${PREFIX}${name} (${theme}): reads [${before}], would read [${after}]`,
        );
      }
    }
  }
  if (changes.length) {
    throw new Error(
      [
        'These SDK variables would read different SDK variables, which breaks overrides of what they read now:',
        ...changes,
        'Keep the current definition in SDK_DEFINITIONS, or accept the change in ALLOWED_READ_CHANGES (scripts/design-tokens-mapping.mts).',
      ].join('\n'),
    );
  }
};

const formatDeclaration = ({ comment, name, trailingComment, value }: Declaration) => [
  ...comment,
  `  ${PREFIX}${name}: ${value};${trailingComment ? ` ${trailingComment}` : ''}`,
];

const tokensCommit = () => {
  try {
    return execFileSync('git', ['-C', tokensRepo, 'rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'unknown commit';
  }
};

const writeTheme = async (theme: Theme, declarations: Declaration[], commit: string) => {
  const path = resolve(root, `src/styling/${theme}.scss`);
  const source = [
    '/**',
    ' * Do not edit directly: written by `yarn sync-design-tokens` from design-system-tokens',
    ` * build/web/chat/${theme}.scss (${commit}).`,
    ' */',
    '',
    '@mixin variables {',
    ...declarations.flatMap(formatDeclaration),
    '}',
    '',
  ].join('\n');
  const options = await prettier.resolveConfig(path);
  writeFileSync(path, await prettier.format(source, { ...options, filepath: path }));
};

assertMappingStillNeeded();
const emitted = resolveEmittedNames();
const declarations = {
  dark: themeDeclarations('dark', emitted),
  light: themeDeclarations('light', emitted),
};
assertReadsUnchanged({
  dark: new Map(declarations.dark.map(({ name, value }) => [name, value])),
  light: new Map(declarations.light.map(({ name, value }) => [name, value])),
});
const commit = tokensCommit();
for (const theme of THEMES) await writeTheme(theme, declarations[theme], commit);

const addedFromChains = [...emitted].filter((name) => !sdkNames.has(name));
const leftOut = tokens.light.map(({ name }) => name).filter((name) => !emitted.has(name));
console.log(`Wrote ${emitted.size} variables from design-system-tokens ${commit}.`);
if (addedFromChains.length) {
  console.log(`Added, read by SDK variables: ${addedFromChains.join(', ')}`);
}
if (leftOut.length)
  console.log(`Tokens left out (${leftOut.length}): ${leftOut.join(', ')}`);
