// Reads every `t()` call in the library source and reports which keys carry inline English copy.
//
// Two consumers depend on this, and they must agree exactly or the bundled runtime resource and
// the generated types drift apart:
//   - sync-en-from-call-sites.mts  makes the inline copy authoritative for en.json
//   - generate-i18n-keys.mts       emits the key types, and the runtime resource for the keys
//                                 that have *no* inline copy to fall back on
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

export type CallSiteCopy = {
  /** `key -> English copy` for every key written with an inline default. */
  copy: Map<string, string>;
  /** Keys seen with two different inline copies — a key must render one thing. */
  conflicts: Array<{ key: string; a: string; b: string; file: string }>;
};

const isTCallee = (expr: ts.Expression): boolean =>
  (ts.isIdentifier(expr) && expr.text === 't') ||
  (ts.isPropertyAccessExpression(expr) && expr.name.text === 't');

export const sourceFiles = (root = 'src'): string[] => {
  const out: string[] = [];
  (function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'mock-builders') continue;
        walk(full);
      } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        out.push(full);
      }
    }
  })(root);
  return out;
};

export const readCallSiteCopy = (root = 'src'): CallSiteCopy => {
  const copy = new Map<string, string>();
  const seenIn = new Map<string, string>();
  const conflicts: CallSiteCopy['conflicts'] = [];

  const record = (key: string, value: string, file: string) => {
    const existing = copy.get(key);
    if (existing !== undefined && existing !== value) {
      conflicts.push({ a: existing, b: value, file, key });
      return;
    }
    copy.set(key, value);
    seenIn.set(key, file);
  };

  for (const file of sourceFiles(root)) {
    const sourceFile = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    (function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && isTCallee(node.expression)) {
        const [keyArg, second] = node.arguments;
        if (keyArg && ts.isStringLiteralLike(keyArg)) {
          const key = keyArg.text;
          if (second && ts.isStringLiteralLike(second)) {
            // t('key', 'Copy')
            record(key, second.text, file);
          } else if (second && ts.isObjectLiteralExpression(second)) {
            // t('key', { count, defaultValue_one, defaultValue_other })
            for (const prop of second.properties) {
              if (!ts.isPropertyAssignment(prop)) continue;
              const name = prop.name.getText(sourceFile).replace(/['"]/g, '');
              const suffix = name.match(/^defaultValue_(\w+)$/)?.[1];
              if (suffix && ts.isStringLiteralLike(prop.initializer)) {
                record(`${key}_${suffix}`, prop.initializer.text, file);
              }
            }
          }
          // Anything else — `t('timestamp.MessageTimestamp', { timestamp })` — carries no inline
          // copy, so it must resolve from the bundled runtime resource.
        }
      }
      ts.forEachChild(node, visit);
    })(sourceFile);
  }

  return { conflicts, copy };
};
