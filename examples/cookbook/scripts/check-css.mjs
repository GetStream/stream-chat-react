/**
 * Checks every recipe stylesheet against the cookbook's style rules:
 *
 *   layer    every rule sits inside `@layer stream-overrides { … }`; no other layer, no @import
 *   colors   colors come from --str-chat__ tokens: no hex, rgb()/hsl()…, named colors, or var()s
 *            of other custom properties. Setting a --str-chat__ token itself (theming) is allowed
 *   scale    spacing, radius and type use --str-chat__ tokens, not px/rem/em values
 *   prefix   classes the recipe adds start with `cookbook-` (SDK classes `str-chat…` may be restyled)
 *   layout   no display/position/flex/grid/alignment/offsets on a rule that styles SDK markup,
 *            unless a comment right above the rule contains `cookbook-allow-layout:` and says why
 *
 *   yarn workspace @stream-io/stream-chat-react-cookbook check:css
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const recipesDir = path.join(root, 'src/recipes');

const COLOR_PROPERTIES =
  /^(color|background|background-color|background-image|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?|fill|stroke|box-shadow|text-shadow|text-decoration(-color)?|caret-color|accent-color|column-rule(-color)?)$/;
const SCALE_PROPERTIES =
  /^(padding|margin|gap|row-gap|column-gap|border(-[a-z-]+)?-radius|font|font-size|line-height|letter-spacing)(-.+)?$/;
const LAYOUT_PROPERTIES =
  /^(display|position|float|order|inset(-.+)?|top|right|bottom|left|flex(-.+)?|grid(-.+)?|place-.+|align-.+|justify-.+)$/;
const LITERAL_COLOR = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
const SCALE_LITERAL = /(^|[\s(,])-?\d*\.?\d+(px|rem|em)\b/;
// CSS named colors (the keywords a literal color can hide behind).
const NAMED_COLORS = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet
  brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue
  darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange
  darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise
  darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen
  fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred
  indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
  lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
  lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta
  maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue
  mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
  navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen
  paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red
  rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue
  slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white
  whitesmoke yellow yellowgreen`.split(/\s+/),
);

const listCssFiles = async (dir) => {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listCssFiles(full)));
    else if (entry.name.endsWith('.css')) files.push(full);
  }
  return files;
};

const problems = [];
const report = (file, line, rule, message) =>
  problems.push(`${path.relative(root, file)}:${line}  [${rule}] ${message}`);

/**
 * Replaces comments with spaces (so offsets and line numbers stay put) and returns them with their
 * end offsets, so a rule can find the comments written right above it.
 */
const extractComments = (css) => {
  const comments = [];
  let stripped = '';
  let i = 0;
  while (i < css.length) {
    if (css.startsWith('/*', i)) {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) return { error: i };
      comments.push({ end: end + 2, text: css.slice(i + 2, end) });
      stripped += css.slice(i, end + 2).replace(/[^\n]/g, ' ');
      i = end + 2;
    } else {
      stripped += css[i++];
    }
  }
  return { comments, stripped };
};

/** Splits comment-free CSS into blocks, and statements outside any block. */
const parseBlocks = (css) => {
  const blocks = [];
  const statements = [];
  const stack = [];
  let start = 0;
  const lineOf = (index) => css.slice(0, index).split('\n').length;
  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    if (char === '{') {
      const raw = css.slice(start, i);
      const block = {
        declarations: [],
        depth: stack.length,
        line: lineOf(start + raw.search(/\S/)),
        parent: stack[stack.length - 1],
        selector: raw.trim().replace(/\s+/g, ' '),
        selectorStart: start + raw.search(/\S/),
      };
      blocks.push(block);
      stack.push(block);
      start = i + 1;
    } else if (char === '}' || char === ';') {
      const text = css.slice(start, i).trim();
      if (text) {
        if (stack.length) stack[stack.length - 1].declarations.push(text);
        else
          statements.push({
            line: lineOf(start + css.slice(start, i).search(/\S/)),
            text,
          });
      }
      if (char === '}') stack.pop();
      start = i + 1;
    }
  }
  return { blocks, statements };
};

/** The comments between the previous rule boundary and this block's selector. */
const commentsAbove = (comments, original, block) => {
  const before = original.slice(0, block.selectorStart);
  const boundary = Math.max(
    before.lastIndexOf('{'),
    before.lastIndexOf('}'),
    before.lastIndexOf(';'),
  );
  return comments.filter((c) => c.end > boundary && c.end <= block.selectorStart);
};

/** The parts of a value outside var(): what's left once every var(--name, fallback) is removed. */
const outsideVars = (value) => {
  let result = '';
  let depth = 0;
  for (let i = 0; i < value.length; i++) {
    if (value.startsWith('var(', i) && depth === 0) {
      depth = 1;
      i += 3;
      continue;
    }
    if (depth) {
      if (value[i] === '(') depth++;
      else if (value[i] === ')') depth--;
      continue;
    }
    result += value[i];
  }
  return result;
};

const varNames = (value) => [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
const varFallbacks = (value) =>
  [...value.matchAll(/var\(\s*--[\w-]+\s*,([^)]*)\)/g)].map((m) => m[1]);

const hasLiteralColor = (text) =>
  LITERAL_COLOR.test(text) ||
  (text.match(/[a-z]+/gi) ?? []).some((word) => NAMED_COLORS.has(word.toLowerCase()));

// The rule styles SDK markup when its selector involves an SDK class and the element it targets
// (the last compound of the selector) isn't one the recipe added.
const stylesSdkMarkup = (selector) =>
  selector.split(',').some((part) => {
    const compounds = part.trim().split(/\s*[\s>+~]\s*/);
    const target = compounds[compounds.length - 1];
    return /\.str-chat/.test(part) && !/\.cookbook-/.test(target);
  });

for (const file of await listCssFiles(recipesDir)) {
  const original = await readFile(file, 'utf8');
  const extracted = extractComments(original);
  if (extracted.error !== undefined) {
    report(
      file,
      original.slice(0, extracted.error).split('\n').length,
      'syntax',
      'unterminated comment',
    );
    continue;
  }
  const { comments, stripped } = extracted;
  const { blocks, statements } = parseBlocks(stripped);

  for (const statement of statements) {
    report(
      file,
      statement.line,
      'layer',
      `"${statement.text}" is outside @layer stream-overrides`,
    );
  }

  for (const block of blocks) {
    if (block.depth === 0) {
      if (block.selector !== '@layer stream-overrides') {
        report(
          file,
          block.line,
          'layer',
          `"${block.selector}" is outside @layer stream-overrides`,
        );
      }
      continue;
    }
    if (block.selector.startsWith('@layer') || block.selector.startsWith('@import')) {
      report(
        file,
        block.line,
        'layer',
        `recipes don't add layers of their own: "${block.selector}"`,
      );
      continue;
    }
    if (block.selector.startsWith('@')) continue;

    for (const className of block.selector.match(/\.[a-zA-Z_-][\w-]*/g) ?? []) {
      const name = className.slice(1);
      if (!name.startsWith('cookbook-') && !name.startsWith('str-chat')) {
        report(file, block.line, 'prefix', `.${name} should start with .cookbook-`);
      }
    }

    const sdkMarkup = stylesSdkMarkup(block.selector);
    const layoutAllowed = commentsAbove(comments, original, block).some((c) =>
      /cookbook-allow-layout:\s*\S/.test(c.text),
    );

    for (const declaration of block.declarations) {
      const separator = declaration.indexOf(':');
      if (separator === -1) continue;
      const property = declaration.slice(0, separator).trim().toLowerCase();
      const value = declaration.slice(separator + 1).trim();
      const nonTokenVars = varNames(value).filter(
        (name) => !name.startsWith('--str-chat__'),
      );
      const literalText = [outsideVars(value), ...varFallbacks(value)].join(' ');

      // Setting an SDK token is theming, so `--str-chat__*` may hold literal values. A recipe's own
      // custom properties may hold sizes, never colors.
      if (property.startsWith('--')) {
        if (!property.startsWith('--str-chat__') && hasLiteralColor(literalText)) {
          report(
            file,
            block.line,
            'colors',
            `${property}: ${value} — use a --str-chat__ color token`,
          );
        }
        continue;
      }

      if (
        COLOR_PROPERTIES.test(property) &&
        (hasLiteralColor(literalText) || nonTokenVars.length)
      ) {
        report(
          file,
          block.line,
          'colors',
          `${property}: ${value} — use a --str-chat__ color token`,
        );
      }
      if (
        SCALE_PROPERTIES.test(property) &&
        (SCALE_LITERAL.test(literalText) || nonTokenVars.length)
      ) {
        report(
          file,
          block.line,
          'scale',
          `${property}: ${value} — use a --str-chat__ spacing, radius or font token`,
        );
      }
      if (sdkMarkup && LAYOUT_PROPERTIES.test(property) && !layoutAllowed) {
        report(
          file,
          block.line,
          'layout',
          `${property} on "${block.selector}" changes the SDK's layout; style your own markup, use a component variable, or justify it with a cookbook-allow-layout: comment`,
        );
      }
    }
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(
    `\n${problems.length} problem(s). The rules are in .agents/skills/react-ui-cookbook/SKILL.md.`,
  );
  process.exit(1);
}
console.log('Recipe CSS follows the cookbook style rules.');
