// What teaches an agent's model to write A2UI, and what checks what it is shown. It runs the
// A2UI core alone, without the React renderer, so it runs on a server or in a build too.
import {
  Catalog,
  type ComponentApi,
  getComponentReferences,
  MAX_GLOBAL_DEPTH,
  MessageProcessor,
  RELAXED_VALIDATION,
} from '@a2ui/web_core';
import { basicCatalog } from '@a2ui/web_core/catalogs/basic/v1';

import type { AIUIComponent } from '../AIComponents/GenerativeUI/AIUIComponent';
import type { AIUIComponentDefinition } from '../AIComponents/GenerativeUI/AIUIComponentDefinition';
import { isRecord } from '../AIComponents/GenerativeUI/AIUIHelpers';
import {
  A2UI_PROTOCOL_OVERVIEW,
  type A2UIInstructionsConfig,
  A2UIInstructionsError,
  blocksIn,
  fenceOf,
  sorted,
  toolLine,
  TOOLS_INTRODUCTION,
  writing,
} from './A2UIInstructions';
import { A2UI_VERSION, a2uiMessagesIn, normalizeA2UIMessage } from './A2UIStream';
import {
  A2UI_DEFAULT_CATALOG_ID,
  A2UI_LEGACY_CATALOG_ID,
  a2uiAppCatalogDocument,
} from './catalogDocument';

type Entry = ComponentApi;

const definitionOf = (component: AIUIComponent | AIUIComponentDefinition) =>
  'definition' in component ? component.definition : component;

/**
 * The catalog an agent writes with: the basic catalog, or what `keep` names of it without what
 * `remove` names, and the app's components, but one named like a basic component it keeps.
 */
export const a2uiCatalogFor = ({
  catalogId = A2UI_DEFAULT_CATALOG_ID,
  components = [],
  keep,
  remove = [],
}: Pick<A2UIInstructionsConfig, 'catalogId' | 'components' | 'keep' | 'remove'> = {}) => {
  const kept = keep && new Set(keep);
  const removed = new Set(remove);
  const ofBasic = (names: Iterable<string>) =>
    [...names].filter((name) => (!kept || kept.has(name)) && !removed.has(name));
  const basicComponents = ofBasic(basicCatalog.components.keys());
  const definitions = components.map(definitionOf);
  const app = definitions.length
    ? [
        ...Catalog.fromJson(
          a2uiAppCatalogDocument(catalogId, definitions, { bindings: false }),
          A2UI_VERSION,
        ).components.values(),
      ].filter(({ name }) => !basicComponents.includes(name))
    : [];
  // The catalog's guidelines, without its examples: they name the basic catalog rather than
  // this one, and components `keep` may leave out.
  const guidelines = basicCatalog.instructions?.split('\n## Examples')[0].trim();
  return (basicCatalog as unknown as Catalog<Entry>).derive({
    catalogId,
    components: [...basicComponents, ...app],
    functions: ofBasic(basicCatalog.functions.keys()),
    ...(guidelines ? { instructions: guidelines } : {}),
  });
};

/**
 * The instructions that teach an agent's model to write A2UI the app's renderer shows, in
 * Markdown: how a reply carries its UI, the protocol, the catalog's guidelines and the catalog
 * itself with the app's components, then what `config` adds. The same as StreamChatA2UI's
 * `A2UIInstructions`. Throws an `A2UIInstructionsError` when an example would not render.
 */
export const a2uiInstructionsText = (config: A2UIInstructionsConfig = {}) => {
  const catalog = a2uiCatalogFor(config);
  const fence = fenceOf(config.fence);
  const broken = (config.examples ?? []).flatMap((example) =>
    blocksIn(example, fence).flatMap((block) =>
      a2uiProblemsWith(block, catalog).map((problem) => `example: ${problem}`),
    ),
  );
  if (broken.length) throw new A2UIInstructionsError(broken);
  const { instructions, ...document } = catalog.toJson() as Record<string, unknown>;
  const { examples = [], notes = [], preamble, rules = [], tools = [] } = config;
  return [
    ...(preamble ? [preamble] : []),
    writing(fence, catalog.id),
    A2UI_PROTOCOL_OVERVIEW,
    ...(typeof instructions === 'string' && instructions ? [instructions] : []),
    ...(notes.length ? [`## The app's components\n\n${notes.join('\n')}`] : []),
    ...(tools.length
      ? [`${TOOLS_INTRODUCTION}\n\n${tools.map(toolLine).join('\n')}`]
      : []),
    `## The catalog \`${catalog.id}\`\n\n\`\`\`json\n${JSON.stringify(sorted(document))}\n\`\`\``,
    ...(rules.length
      ? [`## Rules\n\n${rules.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}`]
      : []),
    ...(examples.length ? [`## Examples\n\n${examples.join('\n\n')}`] : []),
  ].join('\n\n');
};

type Components = Map<string, Record<string, unknown>>;

const MESSAGE_KINDS = [
  'createSurface',
  'updateComponents',
  'updateDataModel',
  'deleteSurface',
  'callRendererFunction',
  'agentFunctionResponse',
];

const componentsOf = (value: unknown) =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const duplicates = (components: Record<string, unknown>[], surfaceId: string) => {
  const seen = new Set<unknown>();
  const repeated = new Set<unknown>();
  for (const { id } of components) {
    if (seen.has(id)) repeated.add(id);
    seen.add(id);
  }
  return [...repeated].map(
    (id) => `surface ${surfaceId} defines ${String(id)} more than once in one message`,
  );
};

/**
 * What is wrong with the A2UI messages of `text` for a renderer with `catalog`, or nothing
 * when they render as written: messages it can't read, components it doesn't have or that don't
 * fit their schemas, and references that lead nowhere. As StreamChatA2UI's `A2UIProgram`, with
 * each component checked against its schema by the A2UI core as a renderer checks it.
 */
export const a2uiProblemsWith = (text: string, catalog: Catalog<Entry>) => {
  const problems: string[] = [];
  const surfaces = new Map<string, Components>();
  let created = false;
  for (const raw of a2uiMessagesIn(text)) {
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      json = undefined;
    }
    if (!isRecord(json)) {
      problems.push(`this isn't JSON: ${raw.slice(0, 80)}`);
      continue;
    }
    const message = normalizeA2UIMessage(json, catalog.id);
    const kind = MESSAGE_KINDS.find((name) => name in message);
    const body = kind ? message[kind] : undefined;
    const surfaceId = isRecord(body) ? body.surfaceId : undefined;
    if (!kind) {
      problems.push(`this isn't an A2UI message: ${raw.slice(0, 80)}`);
    } else if (kind === 'callRendererFunction' || kind === 'agentFunctionResponse') {
      problems.push("a reply's UI calls no functions");
    } else if (typeof surfaceId !== 'string' || !isRecord(body)) {
      problems.push(`a ${kind} names no surfaceId`);
    } else if (kind === 'createSurface') {
      if (surfaces.has(surfaceId)) {
        problems.push(
          `surface ${surfaceId} is created again: delete it first, or change it with updateComponents and updateDataModel`,
        );
        continue;
      }
      created = true;
      const components = componentsOf(body.components);
      problems.push(...duplicates(components, surfaceId));
      // The renderer with the default id also shows the default's former id.
      const named = body.catalogId;
      const isFormerDefault =
        catalog.id === A2UI_DEFAULT_CATALOG_ID && named === A2UI_LEGACY_CATALOG_ID;
      if (typeof named === 'string' && named !== catalog.id && !isFormerDefault) {
        problems.push(
          `surface ${surfaceId} names the catalog ${body.catalogId}, not ${catalog.id}`,
        );
      }
      surfaces.set(
        surfaceId,
        new Map(components.map((component) => [String(component.id), component])),
      );
    } else if (kind === 'updateComponents') {
      const kept = surfaces.get(surfaceId);
      if (!kept) {
        problems.push(`surface ${surfaceId} gets components before it is created`);
        continue;
      }
      const components = componentsOf(body.components);
      problems.push(...duplicates(components, surfaceId));
      for (const component of components) kept.set(String(component.id), component);
    } else if (kind === 'updateDataModel' && !surfaces.has(surfaceId)) {
      problems.push(`surface ${surfaceId} gets data before it is created`);
    } else if (kind === 'deleteSurface') {
      // What a deleted surface held never shows; its id may be created again.
      surfaces.delete(surfaceId);
    }
  }
  if (!created) problems.push('nothing renders: there is no createSurface');
  for (const [surfaceId, components] of surfaces) {
    problems.push(...surfaceProblems(components, surfaceId, catalog));
  }
  return problems;
};

// Each component checked against its schema, by the A2UI core as a renderer checks it, then
// what the surface's components make together.
const surfaceProblems = (
  components: Components,
  surfaceId: string,
  catalog: Catalog<Entry>,
) => {
  const problems: string[] = [];
  const processor = new MessageProcessor([catalog], undefined, {
    reportErrorsOnly: true,
  });
  const config = { ...RELAXED_VALIDATION, allowUnknownElements: false };
  processor.processMessagesWithErrors(
    {
      createSurface: { catalogId: catalog.id, surfaceId: 'lint' },
      version: A2UI_VERSION,
    },
    { validationConfig: config },
  );
  const references = new Map<string, string[]>();
  const ids = [...components.keys()].sort();
  for (const id of ids) {
    const component = components.get(id) as Record<string, unknown>;
    const errors = processor.processMessagesWithErrors(
      {
        updateComponents: { components: [component], surfaceId: 'lint' },
        version: A2UI_VERSION,
      },
      { validationConfig: config },
    );
    // A cycle is told once, with the depth, below.
    for (const { error } of errors) {
      if (error.code === 'RECURSION_LIMIT_EXCEEDED') continue;
      problems.push(`${id}: ${String(error.message)}`);
    }
    let children: string[] = [];
    try {
      children = [...getComponentReferences(component, catalog)].map(([child]) => child);
    } catch {
      children = [];
    }
    references.set(id, children);
  }
  for (const [id, children] of references) {
    for (const child of children) {
      if (!components.has(child))
        problems.push(`${id} holds ${child}, which is not defined`);
    }
  }
  if (!components.has('root')) {
    return [...problems, `surface ${surfaceId} has no component with the id root`];
  }
  const reached = new Set<string>();
  const next = ['root'];
  while (next.length) {
    const id = next.pop() as string;
    if (reached.has(id)) continue;
    reached.add(id);
    next.push(...(references.get(id) ?? []));
  }
  for (const id of ids) {
    if (!reached.has(id)) problems.push(`${id} is defined but nothing holds it`);
  }
  return [...problems, ...nestingProblems(references, surfaceId)];
};

// A component that holds itself, directly or through others, never finishes rendering, and a
// renderer stops at MAX_GLOBAL_DEPTH levels.
const nestingProblems = (references: Map<string, string[]>, surfaceId: string) => {
  const problems: string[] = [];
  const depths = new Map<string, number>();
  const visiting = new Set<string>();
  let reportedCycle = false;
  const depthOf = (id: string): number => {
    const known = depths.get(id);
    if (known !== undefined) return known;
    if (visiting.has(id)) {
      if (!reportedCycle) {
        problems.push(
          `${id} holds itself through its children, so it never finishes rendering`,
        );
        reportedCycle = true;
      }
      return 0;
    }
    visiting.add(id);
    const deepest = Math.max(
      0,
      ...(references.get(id) ?? []).filter((child) => references.has(child)).map(depthOf),
    );
    visiting.delete(id);
    depths.set(id, deepest + 1);
    return deepest + 1;
  };
  if (references.has('root') && depthOf('root') > MAX_GLOBAL_DEPTH) {
    problems.push(
      `surface ${surfaceId} nests components deeper than ${MAX_GLOBAL_DEPTH} levels`,
    );
  }
  for (const id of [...references.keys()].sort()) depthOf(id);
  return problems;
};

/** What is wrong with the A2UI messages of `text` for the catalog `config` makes, or nothing. */
export const a2uiProblemsIn = (
  text: string,
  config: Pick<
    A2UIInstructionsConfig,
    'catalogId' | 'components' | 'keep' | 'remove'
  > = {},
) => a2uiProblemsWith(text, a2uiCatalogFor(config));
