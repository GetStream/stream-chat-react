// Collects every translation-key string literal reachable from a `t(...)` call (or from the
// notification-translator option objects), together with the context needed to name it.
import ts from 'typescript';
import type { CallSite, CallSiteForm } from './types.mts';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] ?? 'src';
const OUT = process.argv[3];

const files: string[] = [];
(function walk(dir: string) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'mock-builders') continue;
      walk(p);
    } else if (/\.tsx?$/.test(e.name) && !e.name.endsWith('.d.ts')) files.push(p);
  }
})(ROOT);

// Option properties in the notification translators whose value is a translation key.
const KEY_PROPS = new Set(['fallbackTranslationKey', 'reasonTranslationKey']);

const records: CallSite[] = [];

const isTCallee = (expr: ts.Expression): boolean => {
  if (ts.isIdentifier(expr)) return expr.text === 't';
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text === 't';
  return false;
};

// Walk up to find the JSX attribute or object property this call sits inside, which is the
// best available signal for the modality (aria-label -> ariaLabel, placeholder, title...).
const contextOf = (node: ts.Node): { kind: CallSite['ctxKind']; name: string | null } => {
  let cur = node.parent;
  let depth = 0;
  while (cur && depth < 6) {
    if (ts.isJsxAttribute(cur)) return { kind: 'jsxAttr', name: cur.name.getText() };
    if (
      ts.isPropertyAssignment(cur) &&
      (ts.isIdentifier(cur.name) || ts.isStringLiteral(cur.name))
    )
      return { kind: 'prop', name: cur.name.text };
    if (ts.isJsxExpression(cur) && cur.parent && ts.isJsxElement(cur.parent))
      return { kind: 'jsxChild', name: 'text' };
    cur = cur.parent;
    depth++;
  }
  return { kind: 'none', name: null };
};

const interpolationsOf = (s: string): string[] =>
  [...s.matchAll(/\{\{\s*([\w.]+)\s*(?:,[^}]*)?\}\}/g)].map((m) => m[1]);

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  // Parsing a .ts file as TSX makes the parser read `Foo<Bar>` type arguments as JSX and
  // silently yield a garbage tree, so the script kind has to follow the extension.
  const sf = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const record = (keyNode: ts.Node, form: CallSiteForm): boolean => {
    if (!ts.isStringLiteralLike(keyNode)) return false;
    const key = keyNode.text;
    const { line } = sf.getLineAndCharacterOfPosition(keyNode.getStart(sf));
    const ctx = contextOf(keyNode);
    records.push({
      file,
      line: line + 1,
      key,
      form,
      ctxKind: ctx.kind,
      ctxName: ctx.name,
      interpolations: interpolationsOf(key),
      start: keyNode.getStart(sf),
      end: keyNode.getEnd(),
    });
    return true;
  };

  // Unwrap `a ? 'x' : 'y'` and `v || 'x'` so both branches are captured.
  const recordKeyExpr = (expr: ts.Node | undefined, form: CallSiteForm): void => {
    if (!expr) return;
    if (ts.isStringLiteralLike(expr)) return void record(expr, form);
    if (ts.isConditionalExpression(expr)) {
      recordKeyExpr(expr.whenTrue, 'conditional');
      recordKeyExpr(expr.whenFalse, 'conditional');
      return;
    }
    if (ts.isBinaryExpression(expr)) {
      const op = expr.operatorToken.kind;
      if (
        op === ts.SyntaxKind.BarBarToken ||
        op === ts.SyntaxKind.QuestionQuestionToken
      ) {
        recordKeyExpr(expr.left, 'fallback');
        recordKeyExpr(expr.right, 'fallback');
      }
      return;
    }
    if (ts.isParenthesizedExpression(expr)) return recordKeyExpr(expr.expression, form);
    // t(someVariable) — a runtime key; nothing to rename here.
  };

  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && isTCallee(node.expression)) {
      recordKeyExpr(node.arguments[0], 'literal');
    }
    if (
      ts.isPropertyAssignment(node) &&
      (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
      KEY_PROPS.has(node.name.text)
    ) {
      record(node.initializer, 'optionProp');
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

const out = { generatedFrom: ROOT, count: records.length, records };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

const byForm: Record<string, number> = {};
for (const r of records) byForm[r.form] = (byForm[r.form] ?? 0) + 1;
console.log('call sites:', records.length);
console.log('distinct keys:', new Set(records.map((r) => r.key)).size);
console.log('files:', new Set(records.map((r) => r.file)).size);
console.log('by form:', byForm);
