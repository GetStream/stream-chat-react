// Normalises every `t` stub in the test suite onto one implementation that mirrors i18next:
// positional `defaultValue`, `defaultValue_one`/`_other` plurals, and `{{ variable }}`
// interpolation. Stubs inside `vi.mock` / `vi.hoisted` get an inlined copy, since a top-level
// import is still in its TDZ when those run.
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

// Files whose `t` stub is the subject of the assertion (call-argument spies, deliberate
// undefined-returning spies, or extra key-specific behaviour) and must not be rewritten.
const SKIP = new Set([
  'src/i18n/__tests__/NotificationTranslationBuilder.test.ts',
  'src/i18n/__tests__/utils.test.ts',
  'src/plugins/ChannelDetail/Views/PinnedMessagesView/__tests__/PinnedMessagesView.test.tsx',
  'src/components/Attachment/__tests__/Audio.test.tsx',
]);

const INLINE = `((
        key: string,
        second?: unknown,
        third?: unknown,
      ) => {
        const defaultValue = typeof second === 'string' ? second : undefined;
        const options = ((typeof second === 'object' ? second : third) ?? {}) as Record<
          string,
          unknown
        >;
        let template = defaultValue;
        if (template === undefined && typeof options.count === 'number') {
          template = (options.count === 1
            ? options.defaultValue_one
            : options.defaultValue_other) as string | undefined;
        }
        template ??= options.defaultValue as string | undefined;
        template ??= key;
        return template.replace(/\\{\\{\\s*([\\w.]+)\\s*\\}\\}/g, (whole, name: string) => {
          const value = options[name];
          return value === undefined || value === null ? whole : String(value);
        });
      })`;

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.test\.tsx?$/.test(e.name)) files.push(p);
  }
})('src');

const relativeImport = (from) => {
  const rel = path
    .relative(path.dirname(from), 'src/mock-builders/translator')
    .replace(/\\/g, '/');
  return rel.startsWith('.') ? rel : `./${rel}`;
};

let changed = 0;
let inlined = 0;
let shared = 0;

for (const file of files) {
  if (SKIP.has(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const hoistedRanges = [];
  (function collect(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'vi' &&
      (node.expression.name.text === 'mock' || node.expression.name.text === 'hoisted')
    ) {
      hoistedRanges.push([node.getStart(sf), node.getEnd()]);
    }
    ts.forEachChild(node, collect);
  })(sf);
  const isHoisted = (pos) => hoistedRanges.some(([s, e]) => pos >= s && pos < e);

  // Names that hold a translator stub in these tests.
  const NAMES = new Set([
    't',
    'tAria',
    'tMock',
    'translate',
    'mockTranslation',
    'translator',
  ]);
  const edits = [];
  (function visit(node) {
    let target = null;
    if (
      (ts.isPropertyAssignment(node) || ts.isVariableDeclaration(node)) &&
      ts.isIdentifier(node.name) &&
      NAMES.has(node.name.text)
    ) {
      target = ts.isPropertyAssignment(node) ? node.initializer : node.initializer;
    }
    if (target) {
      let inner = target;
      while (ts.isAsExpression(inner) || ts.isParenthesizedExpression(inner))
        inner = inner.expression;
      let viWrapped = false;
      if (
        ts.isCallExpression(inner) &&
        ts.isPropertyAccessExpression(inner.expression) &&
        ts.isIdentifier(inner.expression.expression) &&
        inner.expression.expression.text === 'vi' &&
        inner.expression.name.text === 'fn' &&
        inner.arguments.length === 1
      ) {
        viWrapped = true;
        inner = inner.arguments[0];
        while (ts.isAsExpression(inner) || ts.isParenthesizedExpression(inner))
          inner = inner.expression;
      }
      // Only rewrite function-shaped stubs; leave spies and references alone.
      if (ts.isArrowFunction(inner) || ts.isFunctionExpression(inner)) {
        const hoisted = isHoisted(inner.getStart(sf));
        if (hoisted) inlined++;
        else shared++;
        edits.push({
          start: inner.getStart(sf),
          end: inner.getEnd(),
          text: hoisted ? INLINE : 'mockT',
          needsImport: !hoisted,
          viWrapped,
        });
      }
    }
    ts.forEachChild(node, visit);
  })(sf);

  if (!edits.length) continue;
  edits.sort((a, b) => b.start - a.start);
  let out = text;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);

  if (
    edits.some((e) => e.needsImport) &&
    !/from\s+['"][^'"]*mock-builders\/translator['"]/.test(out)
  ) {
    const stmt = `import { mockT } from '${relativeImport(file)}';`;
    const lastImport = [...out.matchAll(/^import .*?;$/gms)].pop();
    out = lastImport
      ? `${out.slice(0, lastImport.index + lastImport[0].length)}\n${stmt}${out.slice(lastImport.index + lastImport[0].length)}`
      : `${stmt}\n${out}`;
  }

  fs.writeFileSync(file, out);
  changed++;
}

console.log('files updated:', changed, '| shared mockT:', shared, '| inlined:', inlined);
