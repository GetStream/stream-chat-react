// Tests stub `t` as an identity function. That returned English while keys *were* English;
// now it returns the dotted key. This rewrites those stubs to honour the inline `defaultValue`
// the components pass, so the existing assertions on English copy keep working.
//
// Two output forms, chosen by position:
//   - inside a hoisted `vi.mock(...)` factory -> an inline function (a top-level import would
//     be in its TDZ when the hoisted factory runs)
//   - anywhere else                           -> the shared `mockT` from mock-builders
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const INLINE =
  '(key: string, defaultValue?: unknown) =>\n' +
  "        typeof defaultValue === 'string' ? defaultValue : key";

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

// An arrow function whose body is exactly its single parameter: `(k) => k`, `(k: string) => k`.
const isIdentityArrow = (node, sf) => {
  if (!ts.isArrowFunction(node)) return false;
  if (node.parameters.length !== 1) return false;
  const param = node.parameters[0];
  if (!ts.isIdentifier(param.name)) return false;
  const body = node.body;
  if (ts.isIdentifier(body)) return body.text === param.name.text;
  // `(k) => k.replace(/^aria\//, '')` and `(k) => k.split('/').pop()` are prefix-strippers for
  // the old `aria/` namespace: obsolete, and equivalent to identity for dotted keys.
  const src = body.getText(sf);
  return (
    /^\w+\.replace\(\/\^aria\\\/\/,\s*''\)$/.test(src) ||
    /^\w+\.split\('\/'\)\.pop\(\)$/.test(src)
  );
};

let changed = 0;
let inlineCount = 0;
let importCount = 0;

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  // Ranges covered by hoisted vi.mock factories.
  const hoisted = [];
  (function collect(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'vi' &&
      (node.expression.name.text === 'mock' || node.expression.name.text === 'hoisted')
    ) {
      hoisted.push([node.getStart(sf), node.getEnd()]);
    }
    ts.forEachChild(node, collect);
  })(sf);
  const isHoisted = (pos) => hoisted.some(([s, e]) => pos >= s && pos < e);

  // Find identity arrows bound to a `t` property or a `t` variable.
  const edits = [];
  (function visit(node) {
    let target = null;
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 't'
    ) {
      target = node.initializer;
    } else if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 't' &&
      node.initializer
    ) {
      target = node.initializer;
    }

    if (target) {
      // Unwrap `(...) as SomeType`, `((...))` and `vi.fn(...)`.
      let inner = target;
      let wrapVi = false;
      for (;;) {
        if (ts.isAsExpression(inner) || ts.isParenthesizedExpression(inner)) {
          inner = inner.expression;
          continue;
        }
        if (
          ts.isCallExpression(inner) &&
          ts.isPropertyAccessExpression(inner.expression) &&
          ts.isIdentifier(inner.expression.expression) &&
          inner.expression.expression.text === 'vi' &&
          inner.expression.name.text === 'fn' &&
          inner.arguments.length === 1
        ) {
          wrapVi = true;
          inner = inner.arguments[0];
          continue;
        }
        break;
      }

      if (isIdentityArrow(inner, sf)) {
        const useInline = isHoisted(inner.getStart(sf));
        const replacement = useInline ? INLINE : 'mockT';
        if (useInline) inlineCount++;
        else importCount++;
        edits.push({
          start: inner.getStart(sf),
          end: inner.getEnd(),
          text: wrapVi ? replacement : replacement,
          needsImport: !useInline,
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

console.log('files updated:', changed);
console.log('  -> shared mockT:', importCount);
console.log('  -> inlined (inside vi.mock):', inlineCount);
