import {
  CONSTRUCTION_ONLY_CONFIG_PATHS,
  flattenConfigShape,
  INSTANCE_CONFIG_TREE_KEYS,
  INSTANCE_CONFIG_TREE_SHAPE,
} from 'stream-chat';
import type {
  Channel,
  ConfigNode,
  ConfigShape,
  InstanceConfigTree,
  StreamChat,
  Thread,
} from 'stream-chat';

/**
 * The exact shape `client.config.set()` accepts, derived from the method itself.
 *
 * `stream-chat` does not export the `DeepPartial` helper that appears in that signature, so a consumer
 * who wants to hold a configuration patch in a typed variable has to derive it like this. Worth
 * exporting upstream — noted as a follow-up.
 */
export type ConfigTreePatch = Parameters<StreamChat['config']['set']>[0];

export type Plain = Record<string, unknown>;

export type TreeKey = keyof InstanceConfigTree;

export const isPlainObject = (value: unknown): value is Plain =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * Drops what JSON cannot carry — functions and `undefined` — recursively.
 *
 * `JSON.stringify` would omit both anyway, and that is exactly why they have to go *here* instead. The
 * editor holds the JSON text while `seed` held the object it was built from, so anything stringify
 * silently dropped existed on one side and not the other, and the removal diff read every one of them as
 * a key the user had deleted. `channel.messagePaginator.initialCursor` is `{ headward: undefined,
 * tailward: undefined }` on a fresh paginator, so a single unrelated clear reported five phantom
 * removals. Removing them at the source keeps the two views the same shape by construction.
 *
 * Functions are counted so the UI can say how many were hidden rather than pretending the tree is
 * complete; `undefined` is not, because "this field has no value" is not something to warn about — and
 * because Apply deep-merges, both are *left alone* rather than destroyed.
 */
const stripFunctions = (value: Plain, counter = { n: 0 }): Plain => {
  const result: Plain = {};

  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined) continue;
    if (typeof entry === 'function') {
      counter.n += 1;
      continue;
    }
    if (isPlainObject(entry)) {
      result[key] = stripFunctions(entry, counter);
      continue;
    }
    result[key] = entry;
  }

  return result;
};

/**
 * An instance's resolved configuration, narrowed to the fields the SDK's own shape describes as
 * declarative.
 *
 * A live config object holds more than the tree accepts — internal bookkeeping, cursors, resolved
 * handler functions — and showing all of it invites edits that go nowhere. Filtering against
 * `INSTANCE_CONFIG_TREE_SHAPE` rather than a list maintained here means a field added to the SDK appears
 * automatically, and one removed disappears, with nothing to keep in step.
 */
const pickDeclarative = (config: Plain, shape: ConfigShape, counter: { n: number }) => {
  const out: Plain = {};

  for (const [field, node] of Object.entries(shape)) {
    if (!(field in config)) continue;
    const value = config[field];
    // Same reason as in `stripFunctions`: a declared field left unset must not reach the seed, or it
    // becomes a phantom removal the moment anything else is cleared.
    if (value === undefined) continue;

    if (node.kind === 'group') {
      if (isPlainObject(value)) out[field] = pickDeclarative(value, node.fields, counter);
      continue;
    }
    if (node.type === 'function') {
      counter.n += 1;
      continue;
    }
    out[field] = isPlainObject(value) ? stripFunctions(value, counter) : value;
  }

  return out;
};

type ReadContext = { channel?: Channel; client: StreamChat; thread?: Thread };

const fieldsOf = (key: TreeKey, path?: string): ConfigShape => {
  const top = INSTANCE_CONFIG_TREE_SHAPE[key];
  if (!path) return top.fields;
  const node = top.fields[path];
  return node?.kind === 'group' ? node.fields : {};
};

/**
 * `null` marks a key no instance can speak for — see {@link KEY_READERS}. A no-op function would read the
 * same at the call site but not here, and the difference matters: "nothing to read" is a property of the
 * key worth stating, not an empty implementation.
 */
type KeyReader = ((ctx: ReadContext, counter: { n: number }) => Plain) | null;

/**
 * Where the *current value* of each top-level key is read from.
 *
 * Typed `Record<TreeKey, …>` on purpose: adding a key to the SDK's tree fails this file's build until it
 * is given a reader, which is the guard the previous hand-written feature list did not have — that list
 * simply never mentioned `thread`, and nothing noticed.
 *
 * Four keys return nothing, for two different reasons — both honest answers rather than gaps.
 *
 * `messagePaginator` and `messageOperations` are *shared* keys: they apply to every paginator and every
 * message sender at once, so no single instance's value represents them. What you registered under them
 * is visible under "Registered", and what they resolved to is visible on each parent
 * (`channel.messagePaginator`).
 *
 * `liveLocationManager` and `searchController` are configurable but not reachable from this tab: the SDK
 * does not construct either, so there is no instance on the client to read. `<Chat>` does build a
 * `SearchController`, but this tab reads from a client/channel/thread context rather than from React
 * context. Threading them through for a settings demo is not worth the coupling — the registered values
 * are still shown.
 */
const KEY_READERS: Record<TreeKey, KeyReader> = {
  channel: ({ channel }, counter) =>
    channel
      ? {
          channel: {
            messageOperations: pickDeclarative(
              channel.messageOperations.config as unknown as Plain,
              fieldsOf('channel', 'messageOperations'),
              counter,
            ),
            messagePaginator: pickDeclarative(
              channel.messagePaginator.config as unknown as Plain,
              fieldsOf('channel', 'messagePaginator'),
              counter,
            ),
            pinnedMessagesPaginator: pickDeclarative(
              channel.pinnedMessagesPaginator.config as unknown as Plain,
              fieldsOf('channel', 'pinnedMessagesPaginator'),
              counter,
            ),
          },
        }
      : {},
  client: ({ client }, counter) => ({
    client: {
      messageDelivery: pickDeclarative(
        client.messageDeliveryReporter.config as unknown as Plain,
        fieldsOf('client', 'messageDelivery'),
        counter,
      ),
      notifications: pickDeclarative(
        client.notifications.config as unknown as Plain,
        fieldsOf('client', 'notifications'),
        counter,
      ),
      reminders: pickDeclarative(
        client.reminders.config as unknown as Plain,
        fieldsOf('client', 'reminders'),
        counter,
      ),
      threads: pickDeclarative(
        client.threads.config as unknown as Plain,
        fieldsOf('client', 'threads'),
        counter,
      ),
    },
  }),
  messageComposer: ({ channel }, counter) =>
    channel
      ? {
          messageComposer: pickDeclarative(
            channel.messageComposer.config as unknown as Plain,
            fieldsOf('messageComposer'),
            counter,
          ),
        }
      : {},
  liveLocationManager: null,
  messageOperations: null,
  messagePaginator: null,
  searchController: null,
  thread: ({ thread }, counter) =>
    thread
      ? {
          thread: {
            messageOperations: pickDeclarative(
              thread.messageOperations.config as unknown as Plain,
              fieldsOf('thread', 'messageOperations'),
              counter,
            ),
            messagePaginator: pickDeclarative(
              thread.messagePaginator.config as unknown as Plain,
              fieldsOf('thread', 'messagePaginator'),
              counter,
            ),
          },
        }
      : {},
};

/** Keys whose values cannot be read back from any single instance — see {@link KEY_READERS}. */
export const SHARED_KEYS: readonly TreeKey[] = INSTANCE_CONFIG_TREE_KEYS.filter(
  (key) => KEY_READERS[key] === null,
);

/** What a scope needs in order to show current values, so the UI can offer only pickers that matter. */
export const scopeNeeds = (key: TreeKey | 'all') => ({
  channel: key === 'all' || key === 'channel' || key === 'messageComposer',
  thread: key === 'all' || key === 'thread',
});

export const scopeLabel = (key: TreeKey | 'all') => (key === 'all' ? 'Whole tree' : key);

/**
 * The current state of the configuration tree — every knob with the value its live instance resolved to.
 *
 * Reading through the instances rather than `config.getTree()` is deliberate: `getTree` returns only what
 * was *registered*, which is empty on a fresh client and would make the editor useless. The instances hold
 * defaults, server-derived values and setup-function results too — that is what "current" has to mean
 * here.
 */
export const readCurrentTree = (
  ctx: ReadContext,
  key?: TreeKey,
): { functionsOmitted: number; tree: Plain } => {
  const keys = key ? [key] : INSTANCE_CONFIG_TREE_KEYS;
  const counter = { n: 0 };
  let tree: Plain = {};

  for (const treeKey of keys) {
    const read = KEY_READERS[treeKey];
    if (read) tree = deepMerge(tree, read(ctx, counter));
  }

  return { functionsOmitted: counter.n, tree };
};

const deepMerge = (target: Plain, source: Plain): Plain => {
  const out: Plain = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = out[key];
    out[key] =
      isPlainObject(existing) && isPlainObject(value)
        ? deepMerge(existing, value)
        : value;
  }
  return out;
};

// ---------------------------------------------------------------------------
// Reference — what exists, whether or not it currently has a value
// ---------------------------------------------------------------------------

export type ReferenceRow = {
  /** Read once at construction, so a change never reaches instances that already exist. */
  constructionOnly: boolean;
  depth: number;
  description: string;
  /** Permitted values, for `type: 'enum'` — lets the row render a select rather than a free-text box. */
  enumValues?: readonly string[];
  /** Absent for groups and for anything JSON cannot carry. */
  insertValue?: unknown;
  kind: ConfigNode['kind'];
  path: string;
  type: string;
};

const constructionOnlyPaths = new Set(
  Object.entries(CONSTRUCTION_ONLY_CONFIG_PATHS).flatMap(([key, paths]) =>
    paths.map((path) => `${key}.${path}`),
  ),
);

/** A value of the right type to start editing from, so a path can be inserted and then changed. */
const placeholderFor = (node: ConfigNode): unknown | undefined => {
  if (node.kind === 'group') return undefined;
  switch (node.type) {
    case 'boolean':
      return false;
    case 'enum':
      return node.enumValues?.[0];
    case 'number':
      return 0;
    case 'number[]':
    case 'string[]':
      return [];
    case 'object':
      return {};
    case 'string':
      return '';
    default:
      // 'function' — JSON cannot carry it, so there is nothing honest to insert.
      return undefined;
  }
};

/**
 * Every path the SDK says exists, for the current scope.
 *
 * This is the discovery surface, and the reason it comes from `INSTANCE_CONFIG_TREE_SHAPE` rather than
 * from the instances: a key with nothing constructed — `thread` before a thread is opened — still has to
 * be listed, or the only way to learn it accepts `messagePaginator` is to read the SDK source.
 */
export const referenceRows = (key?: TreeKey): ReferenceRow[] => {
  const keys = key ? [key] : INSTANCE_CONFIG_TREE_KEYS;

  return keys.flatMap((treeKey) =>
    [
      { node: INSTANCE_CONFIG_TREE_SHAPE[treeKey] as ConfigNode, path: treeKey },
      ...flattenConfigShape(INSTANCE_CONFIG_TREE_SHAPE[treeKey].fields, treeKey),
    ].map(({ node, path }) => ({
      constructionOnly: constructionOnlyPaths.has(path),
      depth: path.split('.').length - 1,
      description: node.description,
      enumValues: node.kind === 'value' ? node.enumValues : undefined,
      insertValue: placeholderFor(node),
      kind: node.kind,
      path,
      type: node.kind === 'group' ? 'group' : node.type,
    })),
  );
};

/** `a.b.c` + value → `{ a: { b: { c: value } } }`, deep-merged into `tree`. */
export const withPath = (tree: Plain, path: string, value: unknown): Plain => {
  const segments = path.split('.');
  const patch: Plain = {};
  let cursor = patch;

  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      cursor[segment] = value;
      return;
    }
    const next: Plain = {};
    cursor[segment] = next;
    cursor = next;
  });

  return deepMerge(tree, patch);
};

/** The value a path currently carries in the editor, or `undefined` when it carries none. */
export const valueAtPath = (tree: Plain, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (cursor, segment) =>
        cursor && typeof cursor === 'object'
          ? (cursor as Record<string, unknown>)[segment]
          : undefined,
      tree,
    );

/** Whether a path already carries a value in the editor, so the UI can say "shown" instead of "insert". */
export const hasPathValue = (tree: Plain, path: string): boolean =>
  hasPath(tree, path.split('.'));

// ---------------------------------------------------------------------------
// Parsing, diffing, reporting
// ---------------------------------------------------------------------------

export type ParseResult =
  | { error: string; ok: false }
  | { ok: true; tree: Plain; unknownKeys: string[] };

export const parseTree = (input: string): ParseResult => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Invalid JSON', ok: false };
  }

  if (!isPlainObject(parsed)) {
    return { error: 'The configuration tree must be a JSON object.', ok: false };
  }

  // An unrecognised key is not an error — the key space is deliberately open, so a custom key is
  // legitimate. It is still worth surfacing, because a typo ('cahnnel') is indistinguishable from an
  // intentional custom key and would otherwise be a silent no-op.
  return {
    ok: true,
    tree: parsed,
    unknownKeys: Object.keys(parsed).filter(
      (key) => !(INSTANCE_CONFIG_TREE_KEYS as readonly string[]).includes(key),
    ),
  };
};

/**
 * The subset of `next` whose leaves differ from `baseline`, keeping the tree shape.
 *
 * The editor is seeded with *resolved* values, so applying it verbatim would register the entire tree —
 * defaults and server-derived values alike — as your declarative configuration. That is wrong twice over:
 * it freezes today's defaults against future SDK changes, and it turns a server-decided value like
 * `location.enabled` into something you appear to have chosen. Sending only what actually changed keeps
 * the declarative tier meaning "things the integrator asked for".
 */
export const pickChanged = (next: Plain, baseline: Plain): Plain => {
  const out: Plain = {};

  for (const [key, value] of Object.entries(next)) {
    const before = baseline[key];

    if (isPlainObject(value)) {
      const nested = pickChanged(value, isPlainObject(before) ? before : {});
      if (Object.keys(nested).length > 0) out[key] = nested;
      continue;
    }

    if (JSON.stringify(value) !== JSON.stringify(before)) out[key] = value;
  }

  return out;
};

/**
 * Paths the editor was seeded with and no longer has — the deletions `pickChanged` cannot express.
 *
 * `pickChanged` returns what to *write*, and there is no value that means "unregister this": `set()`
 * deep-merges, so an absent key is simply not mentioned and whatever was registered survives. Removals
 * therefore have to be derived separately, by asking what the editor lost rather than what it gained.
 *
 * Compared against the **seed** rather than against the registered tree, because only the seed
 * distinguishes "the user deleted this line" from "this path is not shown here". Function-valued
 * settings, shared keys and everything outside the current scope are all absent from the draft by
 * design; diffing the registered tree against the draft would read every one of them as a deletion and
 * unregister configuration the user never touched.
 */
export const removedPaths = (seed: Plain, next: Plain): string[] => {
  const after = leaves(next);
  return [...leaves(seed).keys()].filter((path) => !after.has(path));
};

/**
 * `tree` without the given paths, dropping any object left empty.
 *
 * The empty-object pruning is what makes this usable as a replacement registration: a key whose subtree
 * became `{}` must disappear, since `getTree()` omits empty keys and leaving one behind would make the
 * "(n keys)" count report registrations that hold nothing.
 */
export const omitPaths = (tree: Plain, paths: readonly string[]): Plain => {
  const prune = (node: Plain, prefix: string): Plain => {
    const out: Plain = {};
    for (const [key, value] of Object.entries(node)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (paths.includes(path)) continue;
      if (isPlainObject(value)) {
        const nested = prune(value, path);
        if (Object.keys(nested).length > 0) out[key] = nested;
        continue;
      }
      out[key] = value;
    }
    return out;
  };

  return prune(tree, '');
};

/** Every leaf as `a.b.c` → value, so two trees can be compared path by path. */
const leaves = (tree: Plain, prefix = ''): Map<string, unknown> => {
  const out = new Map<string, unknown>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(value)) {
      for (const [k, v] of leaves(value, path)) out.set(k, v);
    } else {
      out.set(path, value);
    }
  }
  return out;
};

/**
 * Paths that were asked for but are not what the instances ended up with.
 *
 * This is the honest answer to "did my change land?", and it is not a rhetorical question: the server can
 * veto a value (`messageComposer.location.enabled` against `shared_locations: false`), a setup function
 * registered on the same key wins over the declarative tier, and construction-only paths are read once.
 * Comparing requested against re-read current state catches all three without having to enumerate them.
 */
export const diffAgainstCurrent = (requested: Plain, current: Plain) => {
  const currentLeaves = leaves(current);
  const rejected: { path: string; requested: unknown; resulting: unknown }[] = [];
  let judged = 0;

  for (const [path, want] of leaves(requested)) {
    // Not a knob this scope reads back — no instance exists to hold it, typically because the entity has
    // not been constructed yet. Counted separately rather than passed over, so the UI can say "cannot
    // confirm" instead of the false "confirmed" that an empty rejection list would otherwise imply.
    if (!currentLeaves.has(path)) continue;
    judged += 1;
    const got = currentLeaves.get(path);
    if (JSON.stringify(got) !== JSON.stringify(want)) {
      rejected.push({ path, requested: want, resulting: got });
    }
  }

  return { judged, rejected };
};

/**
 * Flags paths that only take effect at construction time. `client.config.set` accepts them and the LLC
 * logs a debug warning, but instances that already exist keep their current value — so changing
 * `initialCursor` on an open channel does nothing, with no visible reason why.
 */
export const findConstructionOnlyPaths = (tree: Plain) => {
  const hits: string[] = [];

  for (const [key, paths] of Object.entries(CONSTRUCTION_ONLY_CONFIG_PATHS)) {
    const subtree = tree[key];
    if (!isPlainObject(subtree)) continue;

    for (const path of paths) {
      if (hasPath(subtree, path.split('.'))) hits.push(`${key}.${path}`);
    }
  }

  return hits;
};

const hasPath = (value: Plain, segments: string[]): boolean => {
  const [head, ...rest] = segments;
  if (!(head in value)) return false;
  if (rest.length === 0) return true;
  const next = value[head];
  return isPlainObject(next) ? hasPath(next, rest) : false;
};

export const formatTree = (tree: unknown) => JSON.stringify(tree, null, 2);
