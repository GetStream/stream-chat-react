// What `validate-ai-ui-tokens` checks: that every colour a generated UI renderer's own elements
// read from their `--a2ui-*` / `--openui-*` variables is set by `ai-components.css`, rather than
// left to the package's own value, which is a light theme's (A2UI's fallbacks), or follows the
// person's system rather than Stream's theme (OpenUI's defaults).

/** A colour written out, rather than read from a variable. `transparent` and `currentColor` follow the theme. */
const COLOUR_LITERAL =
  /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|light-dark)\(|\b(?:red|white|black|blue|green|gray|grey|orange|yellow|purple|pink)\b/i;

export const hasColourLiteral = (value: string) => COLOUR_LITERAL.test(value);

/** The text inside the parentheses that open at `open`, which is the index of a `(`. */
const balanced = (text: string, open: number) => {
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === '(') depth += 1;
    else if (text[index] === ')') {
      depth -= 1;
      if (depth === 0) return text.slice(open + 1, index);
    }
  }
  return undefined;
};

/** A `var()` read: the variable, and its fallback as written, if any. */
export type VariableRead = { name: string; fallback?: string };

/** Every `var(--<prefix>…)` in `source`, nested ones included. */
export const variableReads = (source: string, prefix: string): VariableRead[] => {
  const reads: VariableRead[] = [];
  const opener = new RegExp(`var\\(\\s*(--${prefix}[a-z0-9-]*)`, 'gi');
  for (const match of source.matchAll(opener)) {
    const open = (match.index ?? 0) + 3;
    const inside = balanced(source, open);
    if (inside === undefined) continue;
    const comma = inside.indexOf(',');
    reads.push({
      fallback: comma < 0 ? undefined : inside.slice(comma + 1).trim(),
      name: match[1],
    });
  }
  return reads;
};

/** The custom properties declared in the rules whose selector is exactly `selector`. */
export const declaredIn = (css: string, selector: string) => {
  const declared = new Set<string>();
  const uncommented = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, selectors, body] of uncommented.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const list = selectors.split(',').map((one) => one.trim());
    if (!list.includes(selector)) continue;
    for (const [, name] of body.matchAll(/(--[a-z0-9_-]+)\s*:/gi)) declared.add(name);
  }
  return declared;
};

// Whether a fallback leaves the value to a colour written out: `var(--a, #666)` does, and
// `var(--a, var(--b, #666))` does unless `--b` is set. Other variables in it are reads of their own.
const fallsBackToColour = (
  fallback: string | undefined,
  isSet: (name: string) => boolean,
): boolean => {
  if (fallback === undefined) return false;
  // A fallback that is one variable: what that one falls back to, unless it is set.
  if (/^var\(/i.test(fallback) && balanced(fallback, 3)?.length === fallback.length - 5) {
    const [inner] = variableReads(fallback, '');
    return !isSet(inner.name) && fallsBackToColour(inner.fallback, isSet);
  }
  return hasColourLiteral(withoutVariables(fallback));
};

// The text with each `var(…)` in it taken out.
const withoutVariables = (text: string) => {
  let rest = text;
  for (let start = rest.search(/var\(/i); start >= 0; start = rest.search(/var\(/i)) {
    const inside = balanced(rest, start + 3);
    if (inside === undefined) break;
    rest = rest.slice(0, start) + rest.slice(start + inside.length + 5);
  }
  return rest;
};

export type Finding = { name: string; source: string; value: string };

/**
 * The colours A2UI's elements read that `declared` leaves to their written-out fallbacks, from
 * the elements' sources by file name.
 */
export const unsetA2UIColours = (
  sources: Record<string, string>,
  declared: Set<string>,
  allowed: Record<string, string> = {},
): Finding[] => {
  const isSet = (name: string) => declared.has(name) || name in allowed;
  const findings = new Map<string, Finding>();
  for (const [source, text] of Object.entries(sources)) {
    for (const read of variableReads(text, 'a2ui-')) {
      if (isSet(read.name) || findings.has(read.name)) continue;
      if (fallsBackToColour(read.fallback, isSet)) {
        findings.set(read.name, { name: read.name, source, value: read.fallback ?? '' });
      }
    }
  }
  return [...findings.values()].sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * The colours OpenUI's components read that `declared` leaves to OpenUI's defaults, from its
 * components' stylesheet and the stylesheet that defines its defaults.
 */
export const unsetOpenUIColours = (
  componentsCss: string,
  defaultsCss: string,
  declared: Set<string>,
  allowed: Record<string, string> = {},
): Finding[] => {
  const defaults = new Map<string, string>();
  for (const [, name, value] of defaultsCss.matchAll(
    /(--openui-[a-z0-9-]+)\s*:\s*([^;}]+)/gi,
  )) {
    if (!defaults.has(name)) defaults.set(name, value.trim());
  }
  const findings = new Map<string, Finding>();
  for (const read of variableReads(componentsCss, 'openui-')) {
    if (declared.has(read.name) || read.name in allowed || findings.has(read.name))
      continue;
    const value = defaults.get(read.name) ?? read.fallback ?? '';
    if (hasColourLiteral(value)) {
      findings.set(read.name, { name: read.name, source: 'components.css', value });
    }
  }
  return [...findings.values()].sort((a, b) => a.name.localeCompare(b.name));
};
