// Finds the values the AI components' stylesheets write out instead of reading from the SDK's
// design tokens (`src/styling/light.scss`, `dark.scss`, `variables/`), by kind. Pure, so it can
// be tested; `validate-ai-styles.mts` runs it over the stylesheets and holds the counts to a
// baseline that may only go down.
//
// A declaration that has to stay literal says why on its own line, with a trailing
// `// ai-styles: allow <reason>` comment.

export const STYLE_LITERAL_KINDS = [
  'ai-token',
  'colour',
  'font',
  'motion',
  'radius',
  'shadow',
  'size',
  'spacing',
  'z-index',
] as const;

export type StyleLiteralKind = (typeof STYLE_LITERAL_KINDS)[number];

export type StyleLiteral = {
  kind: StyleLiteralKind;
  line: number;
  text: string;
};

export type StyleLiteralCounts = Partial<Record<StyleLiteralKind, number>>;

const ALLOW_MARKER = /\/\/\s*ai-styles:\s*allow\b/;

// Lengths other than 0 and a 1px hairline. Percentages, `fr`, unitless numbers and viewport
// units are layout, not design tokens. A minus sign counts; a hyphen inside a name such as
// `size-24` doesn't.
const LENGTH =
  /(?<![\w.])(?<!\w-)(?!0(?:\.0+)?(?:px|rem|em)\b)(?!1px\b)\d*\.?\d+(?:px|rem|em)\b/;
const COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(\s*[\d.]/i;
// Durations other than 0, which only orders a change.
const DURATION = /(?<![\w.-])(?!0(?:\.0+)?m?s\b)\d*\.?\d+m?s\b/;
const NUMBER = /^-?\d*\.?\d+$/;

const SPACING =
  /^(?:margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left)(?:-|$)/;
const SIZE = /^(?:(?:min-|max-)?(?:width|height|block-size|inline-size)|flex-basis)$/;

/** Removes `/* … *\/` comments, keeping line breaks so line numbers still match. */
const stripBlockComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));

const kindsOf = (property: string, value: string): StyleLiteralKind[] => {
  const kinds: StyleLiteralKind[] = [];
  // The `--str-chat__ai-*` layer, read directly or through the bridge's Sass functions.
  if (/--str-chat__ai-|\bai-(?:token|scale)\(/.test(value)) kinds.push('ai-token');
  if (COLOUR.test(value)) kinds.push('colour');
  // A custom property is judged by the property it feeds, which the scan can't see, so only
  // its colours and AI tokens count.
  if (property.startsWith('--')) return kinds;
  if (
    /^(?:transition|animation)(?:-duration|-delay)?$/.test(property) &&
    DURATION.test(value)
  )
    kinds.push('motion');
  if (
    /^(?:transition|animation)(?:-timing-function)?$/.test(property) &&
    /cubic-bezier\(/.test(value)
  )
    kinds.push('motion');
  if (property === 'z-index' && NUMBER.test(value)) kinds.push('z-index');
  if (property === 'font-weight' && NUMBER.test(value)) kinds.push('font');
  if (property === 'line-height' && (NUMBER.test(value) || LENGTH.test(value)))
    kinds.push('font');
  if ((property === 'font-size' || property === 'font') && LENGTH.test(value))
    kinds.push('font');
  if (
    /^border(?:-[a-z]+)*-radius$/.test(property) &&
    (LENGTH.test(value) || /\b\d+%/.test(value))
  )
    kinds.push('radius');
  if (property === 'box-shadow' && LENGTH.test(value)) kinds.push('shadow');
  if (SPACING.test(property) && LENGTH.test(value)) kinds.push('spacing');
  if (SIZE.test(property) && LENGTH.test(value)) kinds.push('size');
  return kinds;
};

/**
 * The written-out values in one SCSS source. Rules inside `@keyframes` and `@property` blocks
 * are animation geometry and registration, not design tokens, so they are skipped.
 */
export const findStyleLiterals = (source: string): StyleLiteral[] => {
  const findings: StyleLiteral[] = [];
  const rawLines = stripBlockComments(source).split('\n');
  const allowedLines = new Set(
    rawLines.flatMap((line, index) => (ALLOW_MARKER.test(line) ? [index + 1] : [])),
  );
  // `//` comments, but not the `//` of a URL.
  const text = rawLines.map((line) => line.replace(/(?<!:)\/\/.*$/, '')).join('\n');

  // The depths at which an exempt block (`@keyframes`, `@property`) was opened.
  const exempt: number[] = [];
  let depth = 0;
  let parens = 0;
  let segment = '';
  let segmentStart = 1;
  let line = 1;

  const declaration = (endLine: number) => {
    const statement = segment.trim();
    segment = '';
    if (!statement || exempt.length) return;
    // A size handed to a mixin, such as `@include ai-icon(1.125rem)`, is written out too.
    const include = statement.match(/^@include\s+[\w-]+\(([\s\S]*)\)$/);
    if (include && LENGTH.test(include[1])) {
      for (let at = segmentStart; at <= endLine; at += 1)
        if (allowedLines.has(at)) return;
      findings.push({
        kind: 'size',
        line: segmentStart,
        text: statement.replace(/\s+/g, ' '),
      });
      return;
    }
    if (statement.startsWith('@')) return;
    const match = statement.match(/^(--[\w-]+|[a-z-]+)\s*:\s*([\s\S]+)$/i);
    if (!match) return;
    for (let at = segmentStart; at <= endLine; at += 1) if (allowedLines.has(at)) return;
    const [, property, value] = match;
    for (const kind of kindsOf(property.toLowerCase(), value.replace(/\s+/g, ' '))) {
      findings.push({ kind, line: segmentStart, text: statement.replace(/\s+/g, ' ') });
    }
  };

  for (const character of text) {
    if (!segment.trim()) segmentStart = line;
    if (character === '\n') line += 1;
    if (character === '(') parens += 1;
    if (character === ')') parens -= 1;
    if (parens > 0) {
      segment += character;
      continue;
    }
    if (character === '{') {
      if (/@(?:-webkit-)?keyframes\b|@property\b/.test(segment)) exempt.push(depth);
      segment = '';
      depth += 1;
    } else if (character === '}') {
      declaration(line);
      depth -= 1;
      if (exempt.length && exempt[exempt.length - 1] === depth) exempt.pop();
    } else if (character === ';') {
      declaration(line);
    } else {
      segment += character;
    }
  }
  return findings;
};

export const countStyleLiterals = (findings: StyleLiteral[]): StyleLiteralCounts => {
  const counts: StyleLiteralCounts = {};
  for (const { kind } of findings) counts[kind] = (counts[kind] ?? 0) + 1;
  return counts;
};

export type StyleLiteralRegression = {
  baseline: number;
  count: number;
  file: string;
  kind: StyleLiteralKind;
};

/** The file and kind pairs whose count went above the baseline. */
export const regressionsAgainst = (
  baseline: Record<string, StyleLiteralCounts>,
  current: Record<string, StyleLiteralCounts>,
): StyleLiteralRegression[] => {
  const regressions: StyleLiteralRegression[] = [];
  for (const [file, counts] of Object.entries(current)) {
    for (const kind of STYLE_LITERAL_KINDS) {
      const count = counts[kind] ?? 0;
      const allowed = baseline[file]?.[kind] ?? 0;
      if (count > allowed) regressions.push({ baseline: allowed, count, file, kind });
    }
  }
  return regressions;
};
