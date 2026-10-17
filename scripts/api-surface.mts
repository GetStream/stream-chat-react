// Dumps the public API surface of a stream-chat-react checkout and diffs two dumps.
// Used to audit breaking changes between major versions (ai-docs/v15-breaking-changes.md).
//
//   node scripts/api-surface.mts dump --root <checkout> --out <file.json> [--css]
//   node scripts/api-surface.mts diff --base <old.json> --head <new.json> --out <file.json> [--md <file.md>]
//   node scripts/api-surface.mts check --doc <file.md> --diff <diff.json>
//
// `dump` reads the checkout's own package.json `exports` and tsconfig.lib.json, so module
// resolution goes through that checkout's node_modules (its own stream-chat version).
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import ts from 'typescript';

type Member = {
  /** hash of the one-level expansion of every named type the member references */
  fp: string;
  name: string;
  optional: boolean;
  type: string;
};

type Param = { name: string; optional: boolean; type: string };

type Signature = { params: Param[]; returns: string; typeParams: string[] };

type ValueSide = {
  /** destructured prop / option defaults of components and hooks */
  defaults?: Record<string, string>;
  kind: 'class' | 'component' | 'const' | 'context' | 'enum' | 'function' | 'hook';
  /** props (components), context value (contexts), public members (classes), return members (hooks) */
  members?: Member[];
  signatures?: Signature[];
  type: string;
  /** source text of a literal const initializer */
  value?: string;
};

type TypeSide = {
  kind: 'class' | 'enum' | 'interface' | 'type';
  members?: Member[];
  text: string;
  typeParams: string[];
};

type ExportRecord = {
  entry: string;
  file: string;
  line: number;
  name: string;
  typeSide?: TypeSide;
  valueSide?: ValueSide;
};

type RefShape = { members: { name: string; optional: boolean; type: string }[] };

type Dump = {
  css?: {
    classesInMarkup: string[];
    files: Record<string, { classes: string[]; vars: string[] }>;
  };
  exports: Record<string, ExportRecord>;
  package: Record<string, unknown>;
  /** one-level shapes of named types referenced from the public surface, keyed `<origin>#<name>` */
  refs: Record<string, RefShape>;
};

const IMPORT_PATH_RE = /import\("[^"]*"\)\./g;
const MAX_TEXT = 4000;

const sortObject = <T,>(record: Record<string, T>) =>
  Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));

const hash = (value: string) =>
  createHash('sha1').update(value).digest('hex').slice(0, 12);

const clean = (text: string) => {
  const stripped = text.replace(IMPORT_PATH_RE, '').replace(/\s+/g, ' ').trim();
  return stripped.length > MAX_TEXT ? `${stripped.slice(0, MAX_TEXT)}…` : stripped;
};

// ---------------------------------------------------------------------------------------------
// dump
// ---------------------------------------------------------------------------------------------

const resolveEntrySource = (root: string, typesPath: string) => {
  const base = typesPath.replace(/^\.\/dist\/types\//, 'src/').replace(/\.d\.ts$/, '');
  for (const ext of ['.ts', '.tsx']) {
    const candidate = join(root, `${base}${ext}`);
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`cannot map ${typesPath} to a source file under ${root}`);
};

const walk = (dir: string, predicate: (path: string) => boolean, out: string[] = []) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === '__tests__' || name === 'stories' || name === 'mock-builders')
        continue;
      walk(path, predicate, out);
    } else if (predicate(path)) out.push(path);
  }
  return out;
};

const dump = (root: string, withCss: boolean): Dump => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const entries: Record<string, string> = {};
  for (const [key, target] of Object.entries<Record<string, string> | string>(
    pkg.exports,
  )) {
    if (typeof target === 'object' && target.types) {
      entries[key] = resolveEntrySource(root, target.types);
    }
  }

  const configPath = join(root, 'tsconfig.lib.json');
  const parsed = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined },
  );
  if (!parsed) throw new Error(`cannot parse ${configPath}`);
  const program = ts.createProgram({
    options: parsed.options,
    rootNames: parsed.fileNames,
  });
  const checker = program.getTypeChecker();
  const refs: Record<string, RefShape> = {};

  const typeText = (type: ts.Type) =>
    clean(
      checker.typeToString(
        type,
        undefined,
        ts.TypeFormatFlags.NoTruncation |
          ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
          ts.TypeFormatFlags.WriteArrowStyleSignature,
      ),
    );

  const originOf = (declaration: ts.Declaration) => {
    const file = declaration.getSourceFile().fileName;
    const nodeModules = file.lastIndexOf('/node_modules/');
    if (nodeModules >= 0) {
      const rest = file.slice(nodeModules + '/node_modules/'.length).split('/');
      return rest[0].startsWith('@') ? `${rest[0]}/${rest[1]}` : rest[0];
    }
    if (file.includes('/typescript/lib/')) return 'lib';
    return 'local';
  };

  const SKIPPED_ORIGINS = new Set([
    'lib',
    'typescript',
    '@types/react',
    '@types/react-dom',
    'csstype',
  ]);

  // private/protected class members and symbol-keyed members are not part of the public surface
  const isPublicMember = (prop: ts.Symbol) => {
    if (prop.name.startsWith('__@') || prop.name.startsWith('#')) return false;
    const declaration = prop.valueDeclaration ?? prop.declarations?.[0];
    if (!declaration || !ts.canHaveModifiers(declaration)) return true;
    return !ts
      .getModifiers(declaration)
      ?.some(
        (modifier) =>
          modifier.kind === ts.SyntaxKind.PrivateKeyword ||
          modifier.kind === ts.SyntaxKind.ProtectedKeyword,
      );
  };

  const membersOf = (type: ts.Type, location: ts.Node): RefShape['members'] => {
    const constituents = type.isUnion() ? type.types : [type];
    const seen = new Map<
      string,
      { optional: boolean; types: Set<string>; count: number }
    >();
    for (const constituent of constituents) {
      if (!(constituent.flags & ts.TypeFlags.Object) && !constituent.isIntersection())
        continue;
      for (const prop of checker.getPropertiesOfType(constituent)) {
        if (!isPublicMember(prop)) continue;
        const entry = seen.get(prop.name) ?? {
          count: 0,
          optional: false,
          types: new Set(),
        };
        entry.count += 1;
        entry.optional ||= Boolean(prop.flags & ts.SymbolFlags.Optional);
        entry.types.add(typeText(checker.getTypeOfSymbolAtLocation(prop, location)));
        seen.set(prop.name, entry);
      }
    }
    const objectConstituents = constituents.filter(
      (c) => c.flags & ts.TypeFlags.Object || c.isIntersection(),
    ).length;
    return [...seen.entries()]
      .map(([name, entry]) => ({
        name,
        optional: entry.optional || entry.count < objectConstituents,
        type: [...entry.types].sort().join(' | '),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Records the one-level shape of every named non-lib type `type` refers to, and returns their keys.
  const collectRefs = (
    type: ts.Type,
    location: ts.Node,
    depth = 0,
    out = new Set<string>(),
  ) => {
    if (depth > 3) return out;
    if (type.isUnionOrIntersection()) {
      for (const t of type.types) collectRefs(t, location, depth + 1, out);
      return out;
    }
    if (!(type.flags & ts.TypeFlags.Object)) return out;
    const symbol = type.aliasSymbol ?? type.getSymbol();
    const declaration = symbol?.declarations?.[0];
    const named =
      symbol &&
      declaration &&
      !symbol.name.startsWith('__') &&
      !SKIPPED_ORIGINS.has(originOf(declaration));
    if (named) {
      const key = `${originOf(declaration)}#${symbol.name}`;
      if (!out.has(key)) {
        out.add(key);
        if (!refs[key]) {
          refs[key] = { members: [] };
          refs[key] = { members: membersOf(type, location) };
        }
      }
    }
    const args =
      type.aliasTypeArguments ?? checker.getTypeArguments(type as ts.TypeReference);
    for (const arg of args ?? []) collectRefs(arg, location, depth + 1, out);
    for (const signature of type.getCallSignatures()) {
      for (const param of signature.getParameters()) {
        collectRefs(
          checker.getTypeOfSymbolAtLocation(param, location),
          location,
          depth + 1,
          out,
        );
      }
      collectRefs(signature.getReturnType(), location, depth + 1, out);
    }
    return out;
  };

  const memberRecords = (type: ts.Type, location: ts.Node): Member[] =>
    membersOf(type, location).map((member) => {
      const constituents = type.isUnion() ? type.types : [type];
      const keys = new Set<string>();
      for (const constituent of constituents) {
        const prop = checker.getPropertyOfType(constituent, member.name);
        if (prop)
          collectRefs(
            checker.getTypeOfSymbolAtLocation(prop, location),
            location,
            0,
            keys,
          );
      }
      return { ...member, fp: hash([...keys].sort().join(',')) };
    });

  const signatureRecords = (type: ts.Type, location: ts.Node): Signature[] =>
    type.getCallSignatures().map((signature) => ({
      params: signature.getParameters().map((param) => {
        const declaration = param.valueDeclaration as ts.ParameterDeclaration | undefined;
        return {
          name: param.name,
          optional: Boolean(
            declaration &&
            (declaration.questionToken ||
              declaration.initializer ||
              declaration.dotDotDotToken),
          ),
          type: typeText(checker.getTypeOfSymbolAtLocation(param, location)),
        };
      }),
      returns: typeText(signature.getReturnType()),
      typeParams: (signature.getTypeParameters() ?? []).map((tp) => typeText(tp)),
    }));

  // Finds the function that implements a component/hook declaration, unwrapping memo/forwardRef.
  const implementationOf = (
    declaration: ts.Declaration,
  ): ts.FunctionLikeDeclaration | undefined => {
    if (ts.isFunctionDeclaration(declaration)) return declaration;
    if (!ts.isVariableDeclaration(declaration) || !declaration.initializer)
      return undefined;
    let node: ts.Expression = declaration.initializer;
    for (;;) {
      if (
        ts.isAsExpression(node) ||
        ts.isParenthesizedExpression(node) ||
        ts.isSatisfiesExpression(node)
      ) {
        node = node.expression;
      } else if (ts.isCallExpression(node)) {
        const fn = node.arguments.find(
          (arg) => ts.isArrowFunction(arg) || ts.isFunctionExpression(arg),
        );
        if (fn) return fn as ts.FunctionLikeDeclaration;
        const ident = node.arguments.find(ts.isIdentifier);
        if (!ident) return undefined;
        const target = checker.getSymbolAtLocation(ident);
        const targetDeclaration = target?.valueDeclaration ?? target?.declarations?.[0];
        return targetDeclaration ? implementationOf(targetDeclaration) : undefined;
      } else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        return node;
      } else return undefined;
    }
  };

  const defaultsOf = (declaration: ts.Declaration) => {
    const own = defaultsOfFunction(implementationOf(declaration));
    if (own) return own;
    // `export const X = (props) => <XWithContext {...props} />`: the defaults live in a sibling
    // function of the same module, so fall back to every props destructuring in the file.
    const merged: Record<string, string> = {};
    const visit = (node: ts.Node) => {
      if (
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node) ||
        ts.isFunctionDeclaration(node)
      ) {
        Object.assign(merged, defaultsOfFunction(node) ?? {});
      }
      ts.forEachChild(node, visit);
    };
    visit(declaration.getSourceFile());
    return Object.keys(merged).length ? sortObject(merged) : undefined;
  };

  const defaultsOfFunction = (fn: ts.FunctionLikeDeclaration | undefined) => {
    const first = fn?.parameters[0];
    if (!fn || !first) return undefined;
    const defaults: Record<string, string> = {};
    const collect = (pattern: ts.ObjectBindingPattern) => {
      for (const element of pattern.elements) {
        if (!element.initializer) continue;
        const key = element.propertyName?.getText() ?? element.name.getText();
        defaults[key] = clean(element.initializer.getText());
      }
    };
    if (ts.isObjectBindingPattern(first.name)) collect(first.name);
    const paramName = ts.isIdentifier(first.name) ? first.name.text : undefined;
    const body = fn.body && ts.isBlock(fn.body) ? fn.body : undefined;
    if (paramName && body) {
      for (const statement of body.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        for (const decl of statement.declarationList.declarations) {
          if (
            ts.isObjectBindingPattern(decl.name) &&
            decl.initializer &&
            ts.isIdentifier(decl.initializer) &&
            decl.initializer.text === paramName
          ) {
            collect(decl.name);
          }
        }
      }
    }
    return Object.keys(defaults).length ? sortObject(defaults) : undefined;
  };

  const literalValueOf = (declaration: ts.Declaration) => {
    if (!ts.isVariableDeclaration(declaration) || !declaration.initializer)
      return undefined;
    let node: ts.Expression = declaration.initializer;
    while (
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isParenthesizedExpression(node)
    ) {
      node = node.expression;
    }
    const literal =
      ts.isObjectLiteralExpression(node) ||
      ts.isArrayLiteralExpression(node) ||
      ts.isStringLiteral(node) ||
      ts.isNumericLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      node.kind === ts.SyntaxKind.TrueKeyword ||
      node.kind === ts.SyntaxKind.FalseKeyword;
    return literal ? clean(node.getText()) : undefined;
  };

  const contextValueType = (type: ts.Type, location: ts.Node) => {
    const provider = checker.getPropertyOfType(type, 'Provider');
    const consumer = checker.getPropertyOfType(type, 'Consumer');
    if (!provider || !consumer) return undefined;
    const providerType = checker.getTypeOfSymbolAtLocation(provider, location);
    const propsParam = providerType.getCallSignatures()[0]?.getParameters()[0];
    if (!propsParam) return undefined;
    const value = checker.getPropertyOfType(
      checker.getTypeOfSymbolAtLocation(propsParam, location),
      'value',
    );
    return value ? checker.getTypeOfSymbolAtLocation(value, location) : undefined;
  };

  const isObjectLike = (type: ts.Type) =>
    (type.flags & ts.TypeFlags.Object || type.isIntersection()) &&
    !type.getCallSignatures().length &&
    !checker.isArrayType(type);

  const valueSideOf = (
    name: string,
    symbol: ts.Symbol,
    declaration: ts.Declaration,
  ): ValueSide => {
    const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
    const text = typeText(type);
    if (symbol.flags & ts.SymbolFlags.Class) {
      return {
        kind: 'class',
        members: memberRecords(checker.getDeclaredTypeOfSymbol(symbol), declaration),
        signatures: signatureRecords(type, declaration).length
          ? signatureRecords(type, declaration)
          : type.getConstructSignatures().map((signature) => ({
              params: signature.getParameters().map((param) => ({
                name: param.name,
                optional: Boolean(
                  (param.valueDeclaration as ts.ParameterDeclaration | undefined)
                    ?.questionToken,
                ),
                type: typeText(checker.getTypeOfSymbolAtLocation(param, declaration)),
              })),
              returns: '',
              typeParams: [],
            })),
        type: text,
      };
    }
    if (symbol.flags & ts.SymbolFlags.Enum) {
      return { kind: 'enum', members: memberRecords(type, declaration), type: text };
    }
    const contextValue = contextValueType(type, declaration);
    if (contextValue) {
      return {
        kind: 'context',
        members: memberRecords(contextValue, declaration),
        type: text,
      };
    }
    const signatures = signatureRecords(type, declaration);
    if (signatures.length) {
      const first = type.getCallSignatures()[0];
      const isHook = /^use[A-Z0-9]/.test(name);
      const returns = signatures[0].returns;
      const isComponent =
        !isHook &&
        /^[A-Z]/.test(name) &&
        (/ExoticComponent|ComponentType|FC</.test(text) ||
          /(JSX\.Element|ReactElement|ReactNode|ReactPortal|Element|null)\b/.test(
            returns,
          ));
      const kind: ValueSide['kind'] = isHook
        ? 'hook'
        : isComponent
          ? 'component'
          : 'function';
      let members: Member[] | undefined;
      if (isComponent) {
        const propsParam = first.getParameters()[0];
        if (propsParam)
          members = memberRecords(
            checker.getTypeOfSymbolAtLocation(propsParam, declaration),
            declaration,
          );
      } else if (isHook && isObjectLike(first.getReturnType())) {
        members = memberRecords(first.getReturnType(), declaration);
      }
      return {
        defaults: kind === 'function' ? undefined : defaultsOf(declaration),
        kind,
        members,
        signatures,
        type: text,
      };
    }
    return {
      kind: 'const',
      members: isObjectLike(type) ? memberRecords(type, declaration) : undefined,
      type: text,
      value: literalValueOf(declaration),
    };
  };

  const typeSideOf = (symbol: ts.Symbol, declaration: ts.Declaration): TypeSide => {
    const type = checker.getDeclaredTypeOfSymbol(symbol);
    const typeParams = (
      (declaration as ts.InterfaceDeclaration | ts.TypeAliasDeclaration).typeParameters ??
      []
    ).map((tp) => clean(tp.getText()));
    const kind: TypeSide['kind'] =
      symbol.flags & ts.SymbolFlags.Class
        ? 'class'
        : symbol.flags & ts.SymbolFlags.Enum
          ? 'enum'
          : symbol.flags & ts.SymbolFlags.Interface
            ? 'interface'
            : 'type';
    const text = ts.isTypeAliasDeclaration(declaration)
      ? clean(declaration.type.getText())
      : typeText(type);
    const objectLike =
      isObjectLike(type) || (type.isUnion() && type.types.some(isObjectLike));
    return {
      kind,
      members: objectLike ? memberRecords(type, declaration) : undefined,
      text,
      typeParams,
    };
  };

  const exportsRecord: Record<string, ExportRecord> = {};
  for (const [entry, file] of Object.entries(entries)) {
    const sourceFile = program.getSourceFile(file);
    const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
    if (!moduleSymbol) throw new Error(`no module symbol for ${file}`);
    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      const symbol =
        exported.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(exported)
          : exported;
      const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
      if (!declaration) continue;
      const sourcePath = relative(root, declaration.getSourceFile().fileName);
      const record: ExportRecord = {
        entry,
        file: sourcePath,
        line:
          declaration
            .getSourceFile()
            .getLineAndCharacterOfPosition(declaration.getStart()).line + 1,
        name: exported.name,
      };
      const valueFlags =
        ts.SymbolFlags.Function |
        ts.SymbolFlags.Variable |
        ts.SymbolFlags.Class |
        ts.SymbolFlags.Enum;
      const typeFlags =
        ts.SymbolFlags.Interface |
        ts.SymbolFlags.TypeAlias |
        ts.SymbolFlags.Class |
        ts.SymbolFlags.Enum;
      if (symbol.flags & valueFlags) {
        const valueDeclaration = symbol.valueDeclaration ?? declaration;
        record.valueSide = valueSideOf(exported.name, symbol, valueDeclaration);
      }
      if (symbol.flags & typeFlags) {
        const typeDeclaration =
          symbol.declarations?.find(
            (d) =>
              ts.isInterfaceDeclaration(d) ||
              ts.isTypeAliasDeclaration(d) ||
              ts.isClassDeclaration(d) ||
              ts.isEnumDeclaration(d),
          ) ?? declaration;
        record.typeSide = typeSideOf(symbol, typeDeclaration);
      }
      exportsRecord[`${entry}::${exported.name}`] = record;
    }
  }

  const result: Dump = {
    exports: sortObject(exportsRecord),
    package: {
      dependencies: pkg.dependencies ?? {},
      engines: pkg.engines ?? {},
      exports: Object.keys(pkg.exports).sort(),
      peerDependencies: pkg.peerDependencies ?? {},
      peerDependenciesMeta: pkg.peerDependenciesMeta ?? {},
    },
    refs: sortObject(refs),
  };

  if (withCss) {
    const cssDir = join(root, 'dist/css');
    const files: NonNullable<Dump['css']>['files'] = {};
    for (const name of readdirSync(cssDir)
      .filter((n) => n.endsWith('.css'))
      .sort()) {
      // comments mention selectors that no longer exist, and would hide their removal
      const css = readFileSync(join(cssDir, name), 'utf8').replace(
        /\/\*[\s\S]*?\*\//g,
        '',
      );
      files[name] = {
        classes: [...new Set(css.match(/\.str-chat__[A-Za-z0-9_-]+/g) ?? [])]
          .map((c) => c.slice(1))
          .sort(),
        vars: [
          ...new Set(
            [...css.matchAll(/(--str-chat__[A-Za-z0-9_-]+)\s*:/g)].map((m) => m[1]),
          ),
        ].sort(),
      };
    }
    const markup = new Set<string>();
    for (const path of walk(
      join(root, 'src'),
      (p) => /\.tsx?$/.test(p) && !/\.test\.tsx?$/.test(p),
    )) {
      for (const match of readFileSync(path, 'utf8').matchAll(
        /str-chat__[A-Za-z0-9_-]+/g,
      )) {
        markup.add(match[0]);
      }
    }
    result.css = { classesInMarkup: [...markup].sort(), files };
  }
  return result;
};

// ---------------------------------------------------------------------------------------------
// diff
// ---------------------------------------------------------------------------------------------

type Change = {
  /** what changed, machine-readable */
  change: string;
  detail?: string;
  /** whether `check` requires the doc to mention it */
  gated: boolean;
  member?: string;
  symbol: string;
};

type Diff = {
  added: { entry: string; file: string; name: string; kind: string }[];
  changes: Change[];
  css: { removedClasses: string[]; removedFromMarkup: string[]; removedVars: string[] };
  moved: { from: string; name: string; to: string }[];
  package: { change: string; key: string; new?: unknown; old?: unknown }[];
  refs: { key: string; removed: string[]; added: string[]; changed: string[] }[];
  removed: {
    entry: string;
    file: string;
    line: number;
    name: string;
    kind: string;
    renameHint?: string;
  }[];
};

const kindOf = (record: ExportRecord) =>
  [record.valueSide?.kind, record.typeSide?.kind].filter(Boolean).join('+');

const memberNames = (record: ExportRecord) =>
  new Set(
    [...(record.valueSide?.members ?? []), ...(record.typeSide?.members ?? [])].map(
      (m) => m.name,
    ),
  );

const similarity = (a: Set<string>, b: Set<string>) => {
  if (!a.size || !b.size) return 0;
  const shared = [...a].filter((x) => b.has(x)).length;
  return shared / new Set([...a, ...b]).size;
};

const compareMembers = (
  symbol: string,
  base: Member[] | undefined,
  head: Member[] | undefined,
  scope: string,
  out: Change[],
) => {
  if (!base || !head) return;
  const headByName = new Map(head.map((m) => [m.name, m]));
  const baseByName = new Map(base.map((m) => [m.name, m]));
  // A type that now spreads a different base (DOM attributes, a generic polymorphic element,
  // another library's class) would otherwise produce hundreds of per-member entries.
  const removedNames = base.filter((m) => !headByName.has(m.name)).map((m) => m.name);
  if (removedNames.length > 40) {
    out.push({
      change: `${scope}s-mass-removed`,
      detail: `${removedNames.length} of ${base.length} removed, e.g. ${removedNames.slice(0, 12).join(', ')}`,
      gated: true,
      symbol,
    });
    return;
  }
  for (const member of base) {
    const next = headByName.get(member.name);
    if (!next) {
      out.push({
        change: `${scope}-removed`,
        detail: member.type,
        gated: true,
        member: member.name,
        symbol,
      });
      continue;
    }
    if (member.optional && !next.optional) {
      out.push({
        change: `${scope}-now-required`,
        gated: true,
        member: member.name,
        symbol,
      });
    }
    if (member.type !== next.type) {
      out.push({
        change: `${scope}-type-changed`,
        detail: `${member.type}  =>  ${next.type}`,
        gated: false,
        member: member.name,
        symbol,
      });
    } else if (member.fp !== next.fp) {
      out.push({
        change: `${scope}-underlying-type-changed`,
        detail: member.type,
        gated: false,
        member: member.name,
        symbol,
      });
    }
  }
  for (const member of head) {
    if (!baseByName.has(member.name) && !member.optional) {
      out.push({
        change: `${scope}-added-required`,
        detail: member.type,
        gated: true,
        member: member.name,
        symbol,
      });
    }
  }
};

const signatureText = (signatures?: Signature[]) =>
  (signatures ?? [])
    .map(
      (s) =>
        `(${s.params.map((p) => `${p.name}${p.optional ? '?' : ''}: ${p.type}`).join(', ')}) => ${s.returns}`,
    )
    .join(' | ');

const diff = (base: Dump, head: Dump): Diff => {
  const result: Diff = {
    added: [],
    changes: [],
    css: { removedClasses: [], removedFromMarkup: [], removedVars: [] },
    moved: [],
    package: [],
    refs: [],
    removed: [],
  };
  const headByName = new Map<string, ExportRecord[]>();
  for (const record of Object.values(head.exports)) {
    headByName.set(record.name, [...(headByName.get(record.name) ?? []), record]);
  }
  const baseNames = new Set(Object.values(base.exports).map((r) => r.name));
  const addedRecords = Object.entries(head.exports)
    .filter(([key, record]) => !base.exports[key] && !baseNames.has(record.name))
    .map(([, record]) => record);

  for (const [key, record] of Object.entries(base.exports)) {
    let next = head.exports[key];
    if (!next) {
      const elsewhere = headByName.get(record.name)?.[0];
      if (elsewhere) {
        result.moved.push({ from: record.entry, name: record.name, to: elsewhere.entry });
        next = elsewhere;
      } else {
        const names = memberNames(record);
        const directory = record.file.split('/').slice(0, 3).join('/');
        const hint = addedRecords
          .map((candidate) => ({
            candidate,
            score:
              similarity(names, memberNames(candidate)) +
              (candidate.file.startsWith(directory) ? 0.25 : 0) +
              (kindOf(candidate) === kindOf(record) ? 0.1 : 0),
          }))
          .filter(({ score }) => score >= 0.6)
          .sort((a, b) => b.score - a.score)[0];
        result.removed.push({
          entry: record.entry,
          file: record.file,
          kind: kindOf(record),
          line: record.line,
          name: record.name,
          renameHint: hint
            ? `${hint.candidate.name} (${hint.score.toFixed(2)})`
            : undefined,
        });
        continue;
      }
    }
    const symbol = record.name;
    if (kindOf(record) !== kindOf(next)) {
      result.changes.push({
        change: 'kind-changed',
        detail: `${kindOf(record)} => ${kindOf(next)}`,
        gated: true,
        symbol,
      });
    }
    if (record.typeSide && !next.typeSide && record.valueSide) {
      result.changes.push({ change: 'type-export-removed', gated: true, symbol });
    }
    if (record.valueSide && !next.valueSide && record.typeSide) {
      result.changes.push({ change: 'value-export-removed', gated: true, symbol });
    }
    const baseValue = record.valueSide;
    const headValue = next.valueSide;
    if (baseValue && headValue) {
      const scope = baseValue.kind === 'component' ? 'prop' : 'member';
      compareMembers(symbol, baseValue.members, headValue.members, scope, result.changes);
      const baseSig = signatureText(baseValue.signatures);
      const headSig = signatureText(headValue.signatures);
      if (
        baseValue.kind !== 'component' &&
        baseValue.kind !== 'context' &&
        baseSig !== headSig
      ) {
        const baseParams = baseValue.signatures?.[0]?.params ?? [];
        const headParams = headValue.signatures?.[0]?.params ?? [];
        const paramsBroke =
          baseParams.length > headParams.length ||
          headParams.some(
            (p, i) => !p.optional && (i >= baseParams.length || baseParams[i].optional),
          ) ||
          baseParams.some((p, i) => headParams[i] && p.type !== headParams[i].type);
        result.changes.push({
          change: paramsBroke ? 'signature-changed' : 'return-type-changed',
          detail: `${baseSig}  =>  ${headSig}`,
          gated: paramsBroke,
          symbol,
        });
      }
      for (const [prop, value] of Object.entries(baseValue.defaults ?? {})) {
        const nextValue = headValue.defaults?.[prop];
        if (
          nextValue !== value &&
          (headValue.members ?? []).some((m) => m.name === prop)
        ) {
          result.changes.push({
            change: 'default-changed',
            detail: `${value}  =>  ${nextValue ?? '(none)'}`,
            gated: true,
            member: prop,
            symbol,
          });
        }
      }
      if (baseValue.value !== undefined && baseValue.value !== headValue.value) {
        result.changes.push({
          change: 'value-changed',
          detail: `${baseValue.value}  =>  ${headValue.value ?? '(not literal)'}`,
          gated: true,
          symbol,
        });
      }
    }
    if (record.typeSide && next.typeSide) {
      compareMembers(
        symbol,
        record.typeSide.members,
        next.typeSide.members,
        'member',
        result.changes,
      );
      if (record.typeSide.typeParams.join(',') !== next.typeSide.typeParams.join(',')) {
        result.changes.push({
          change: 'type-params-changed',
          detail: `<${record.typeSide.typeParams.join(', ')}>  =>  <${next.typeSide.typeParams.join(', ')}>`,
          gated: true,
          symbol,
        });
      }
      if (!record.typeSide.members && record.typeSide.text !== next.typeSide.text) {
        result.changes.push({
          change: 'type-text-changed',
          detail: `${record.typeSide.text}  =>  ${next.typeSide.text}`,
          gated: false,
          symbol,
        });
      }
    }
  }

  result.added = addedRecords.map((record) => ({
    entry: record.entry,
    file: record.file,
    kind: kindOf(record),
    name: record.name,
  }));

  for (const key of new Set([
    ...Object.keys(base.package),
    ...Object.keys(head.package),
  ])) {
    const oldValue = base.package[key];
    const newValue = head.package[key];
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      for (const item of oldValue)
        if (!newValue.includes(item))
          result.package.push({ change: 'removed', key: `${key}:${item}` });
      for (const item of newValue)
        if (!oldValue.includes(item))
          result.package.push({ change: 'added', key: `${key}:${item}` });
      continue;
    }
    const oldRecord = (oldValue ?? {}) as Record<string, unknown>;
    const newRecord = (newValue ?? {}) as Record<string, unknown>;
    for (const name of new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)])) {
      const a = JSON.stringify(oldRecord[name]);
      const b = JSON.stringify(newRecord[name]);
      if (a === b) continue;
      result.package.push({
        change: a === undefined ? 'added' : b === undefined ? 'removed' : 'changed',
        key: `${key}:${name}`,
        new: newRecord[name],
        old: oldRecord[name],
      });
    }
  }

  for (const [key, shape] of Object.entries(base.refs)) {
    const next = head.refs[key];
    if (!next) continue;
    const nextByName = new Map(next.members.map((m) => [m.name, m]));
    const baseByName = new Map(shape.members.map((m) => [m.name, m]));
    const removed = shape.members
      .filter((m) => !nextByName.has(m.name))
      .map((m) => m.name);
    const added = next.members
      .filter((m) => !baseByName.has(m.name))
      .map((m) => `${m.name}${m.optional ? '?' : ''}`);
    const changed = shape.members
      .filter((m) => {
        const n = nextByName.get(m.name);
        return n && (n.type !== m.type || n.optional !== m.optional);
      })
      .map((m) => {
        const n = nextByName.get(m.name) as Member;
        return `${m.name}${m.optional ? '?' : ''}: ${m.type}  =>  ${n.name}${n.optional ? '?' : ''}: ${n.type}`;
      });
    if (removed.length || added.length || changed.length)
      result.refs.push({ added, changed, key, removed });
  }

  if (base.css && head.css) {
    const all = (d: Dump, field: 'classes' | 'vars') =>
      new Set(Object.values(d.css?.files ?? {}).flatMap((f) => f[field]));
    const headClasses = all(head, 'classes');
    const headVars = all(head, 'vars');
    result.css.removedClasses = [...all(base, 'classes')]
      .filter((c) => !headClasses.has(c))
      .sort();
    result.css.removedVars = [...all(base, 'vars')]
      .filter((v) => !headVars.has(v))
      .sort();
    const headMarkup = new Set(head.css.classesInMarkup);
    result.css.removedFromMarkup = base.css.classesInMarkup.filter(
      (c) => !headMarkup.has(c),
    );
  }
  return result;
};

const areaOf = (file: string) => {
  const parts = file.split('/');
  if (parts[0] !== 'src') return parts[0];
  if (parts[1] === 'components' || parts[1] === 'plugins')
    return `${parts[1]}/${parts[2]}`;
  return parts[1];
};

const diffMarkdown = (result: Diff, base: Dump) => {
  const lines: string[] = ['# API surface diff', ''];
  const fileOf = (name: string) =>
    Object.values(base.exports).find((r) => r.name === name)?.file ?? 'unknown';
  lines.push(`## Removed exports (${result.removed.length})`, '');
  const byArea = new Map<string, string[]>();
  for (const r of result.removed) {
    const area = areaOf(r.file);
    byArea.set(area, [
      ...(byArea.get(area) ?? []),
      `- \`${r.name}\` (${r.kind}, ${r.entry}) ${r.file}:${r.line}${r.renameHint ? ` — rename hint: ${r.renameHint}` : ''}`,
    ]);
  }
  for (const [area, items] of [...byArea.entries()].sort())
    lines.push(`### ${area}`, ...items, '');
  lines.push(`## Moved between entrypoints (${result.moved.length})`, '');
  for (const m of result.moved) lines.push(`- \`${m.name}\`: ${m.from} -> ${m.to}`);
  lines.push('', `## Changed (${result.changes.length})`, '');
  const changesByArea = new Map<string, Change[]>();
  for (const c of result.changes) {
    const area = areaOf(fileOf(c.symbol));
    changesByArea.set(area, [...(changesByArea.get(area) ?? []), c]);
  }
  for (const [area, items] of [...changesByArea.entries()].sort()) {
    lines.push(`### ${area}`);
    for (const c of items) {
      lines.push(
        `- ${c.gated ? '**' : ''}${c.change}${c.gated ? '**' : ''} \`${c.symbol}${c.member ? `.${c.member}` : ''}\`${c.detail ? `: ${c.detail.length > 600 ? `${c.detail.slice(0, 600)}…` : c.detail}` : ''}`,
      );
    }
    lines.push('');
  }
  lines.push(`## Added exports (${result.added.length})`, '');
  for (const a of result.added)
    lines.push(`- \`${a.name}\` (${a.kind}, ${a.entry}) ${a.file}`);
  lines.push('', `## Package (${result.package.length})`, '');
  for (const p of result.package)
    lines.push(
      `- ${p.change} \`${p.key}\`: ${JSON.stringify(p.old)} -> ${JSON.stringify(p.new)}`,
    );
  lines.push('', `## Referenced types whose shape changed (${result.refs.length})`, '');
  for (const r of result.refs) {
    lines.push(`### ${r.key}`);
    if (r.removed.length) lines.push(`- removed: ${r.removed.join(', ')}`);
    if (r.added.length) lines.push(`- added: ${r.added.join(', ')}`);
    for (const c of r.changed)
      lines.push(`- ${c.length > 400 ? `${c.slice(0, 400)}…` : c}`);
    lines.push('');
  }
  lines.push(`## CSS`, '');
  lines.push(
    `### Classes removed from stylesheets (${result.css.removedClasses.length})`,
    result.css.removedClasses.join(' '),
    '',
  );
  lines.push(
    `### Classes removed from markup (${result.css.removedFromMarkup.length})`,
    result.css.removedFromMarkup.join(' '),
    '',
  );
  lines.push(
    `### Custom properties removed (${result.css.removedVars.length})`,
    result.css.removedVars.join(' '),
    '',
  );
  return lines.join('\n');
};

// ---------------------------------------------------------------------------------------------
// check
// ---------------------------------------------------------------------------------------------

const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const check = (doc: string, result: Diff) => {
  const sections = doc.split(/^#{2,4} /m);
  const mentions = (name: string) =>
    new RegExp(`(^|[^A-Za-z0-9_])${escapeRe(name)}([^A-Za-z0-9_]|$)`);
  const missing: string[] = [];
  for (const r of result.removed) {
    if (!mentions(r.name).test(doc)) missing.push(`removed export ${r.name} (${r.file})`);
  }
  for (const c of result.changes.filter((change) => change.gated)) {
    const symbolRe = mentions(c.symbol);
    if (!c.member) {
      if (!symbolRe.test(doc)) missing.push(`${c.change} ${c.symbol}`);
      continue;
    }
    const memberRe = mentions(c.member as string);
    const dotted = doc.includes(`${c.symbol}.${c.member}`);
    if (
      !dotted &&
      !sections.some((section) => symbolRe.test(section) && memberRe.test(section))
    ) {
      missing.push(`${c.change} ${c.symbol}.${c.member}`);
    }
  }
  for (const p of result.package.filter((pkg) => pkg.change !== 'added')) {
    const key = p.key.split(':').slice(1).join(':');
    if (!doc.includes(key)) missing.push(`package ${p.change} ${p.key}`);
  }
  return missing;
};

// ---------------------------------------------------------------------------------------------
// cli
// ---------------------------------------------------------------------------------------------

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    base: { type: 'string' },
    css: { type: 'boolean' },
    diff: { type: 'string' },
    doc: { type: 'string' },
    head: { type: 'string' },
    md: { type: 'string' },
    out: { type: 'string' },
    root: { type: 'string' },
  },
});

const required = (name: keyof typeof values) => {
  const value = values[name];
  if (typeof value !== 'string') throw new Error(`--${name} is required`);
  return resolve(value);
};

const readJson = <T,>(path: string) => JSON.parse(readFileSync(path, 'utf8')) as T;

switch (positionals[0]) {
  case 'dump': {
    const result = dump(required('root'), Boolean(values.css));
    writeFileSync(required('out'), `${JSON.stringify(result, null, 2)}\n`);
    console.log(
      `${Object.keys(result.exports).length} exports, ${Object.keys(result.refs).length} referenced types`,
    );
    break;
  }
  case 'diff': {
    const base = readJson<Dump>(required('base'));
    const result = diff(base, readJson<Dump>(required('head')));
    writeFileSync(required('out'), `${JSON.stringify(result, null, 2)}\n`);
    if (values.md) writeFileSync(resolve(values.md), `${diffMarkdown(result, base)}\n`);
    console.log(
      `${result.removed.length} removed, ${result.moved.length} moved, ${result.changes.length} changed (${result.changes.filter((c) => c.gated).length} gated), ${result.added.length} added`,
    );
    break;
  }
  case 'check': {
    const missing = check(
      readFileSync(required('doc'), 'utf8'),
      readJson<Diff>(required('diff')),
    );
    if (missing.length) {
      console.error(
        `${missing.length} breaking changes not covered by the doc:\n${missing.join('\n')}`,
      );
      process.exit(1);
    }
    console.log('every gated change is covered');
    break;
  }
  default:
    console.error('usage: api-surface.mts <dump|diff|check> [options]');
    process.exit(1);
}
