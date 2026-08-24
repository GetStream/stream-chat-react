import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChannelManagerState, ThreadManagerState } from 'stream-chat';
import { Button, useChatContext, useStateStore } from 'stream-chat-react';
import {
  SettingsTabBody,
  SettingsTabFooter,
  SettingsTabLayoutHeader,
} from '../SettingsTabLayoutComponents.tsx';
import { SearchableSelect } from '../../SearchableSelect';
import { BUILT_IN_INSTANCE_KEYS, INSTANCE_CONFIG_TREE_KEYS } from 'stream-chat';
import type { InstanceSetupKey } from 'stream-chat';
import {
  type ConfigTreePatch,
  diffAgainstCurrent,
  findConstructionOnlyPaths,
  formatTree,
  hasPathValue,
  isPlainObject,
  omitPaths,
  parseTree,
  pickChanged,
  type Plain,
  readCurrentTree,
  referenceRows,
  removedPaths,
  scopeLabel,
  scopeNeeds,
  SHARED_KEYS,
  type TreeKey,
  withPath,
} from './configurationTree';
import { ReferenceValueEditor } from './ReferenceValueEditor';

type ConfigurationTabProps = {
  close: () => void;
};

/**
 * `problems` empty means everything landed. Kept as a separate field rather than inferred from the line
 * count: a single problem and a single success message are both one line, and conflating them dropped the
 * explanatory heading exactly when it was needed most.
 */
type Report = {
  at: number;
  headline: string;
  problems: string[];
};

const paginatorsSelector = (state: ChannelManagerState) => ({
  paginators: state.paginators,
});

const threadsSelector = (state: ThreadManagerState) => ({ threads: state.threads });

/**
 * `client.config` keys its methods on the real key unions, so a segment parsed out of a dotted path
 * has to be narrowed before it can be passed in. Both sets are exported by the client, so these stay
 * correct as keys are added.
 */
const isTreeKey = (key: string): key is TreeKey =>
  (INSTANCE_CONFIG_TREE_KEYS as readonly string[]).includes(key);

const isSetupKey = (key: string): key is InstanceSetupKey =>
  (BUILT_IN_INSTANCE_KEYS as readonly string[]).includes(key);

export const ConfigurationTab = ({ close }: ConfigurationTabProps) => {
  const { channelManager, client } = useChatContext();
  const { paginators } = useStateStore(channelManager.state, paginatorsSelector);
  const { threads } = useStateStore(client.threads.state, threadsSelector);

  const [scope, setScope] = useState<TreeKey | 'all'>('all');
  const [selectedType, setSelectedType] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [draft, setDraft] = useState('');
  // The tree the editor was last seeded with. Apply diffs against this so it registers only what you
  // actually changed, rather than the whole resolved tree.
  const [seed, setSeed] = useState<Record<string, unknown>>({});
  const [report, setReport] = useState<Report | null>(null);
  // Bumped whenever configuration changes, so the editor can be re-seeded from live state.
  const [revision, setRevision] = useState(0);

  const channels = useMemo(
    () =>
      Array.from(
        new Map(
          paginators.flatMap((paginator) => paginator.items ?? []).map((c) => [c.cid, c]),
        ).values(),
      ),
    [paginators],
  );

  /**
   * Channel **types** among the loaded channels, not the channels themselves.
   *
   * Nothing here varies per channel. Configuration is registered per entity type, and the only thing that
   * can make a resolved value differ — server-side channel config, which vetoes declarative values — is
   * itself keyed by type (`client.channelConfigsByType`). So two channels of the same type resolve
   * identically, and offering a channel picker would imply a distinction that does not exist.
   */
  const channelTypes = useMemo(
    () => Array.from(new Set(channels.map((c) => c.type))).sort(),
    [channels],
  );

  const channelType = channelTypes.includes(selectedType)
    ? selectedType
    : (channelTypes[0] ?? '');

  // Any channel of the type will do — they resolve the same. This one is only a read sample.
  const channel = channels.find((c) => c.type === channelType);

  // A thread, unlike a channel, is only a read sample in the same sense: what you register applies to
  // every thread. It exists as a picker at all because a thread has to have been *loaded* for there to be
  // a resolved value to show, and which one is loaded is not something the tab can decide.
  const thread =
    threads.find((candidate) => candidate.id === selectedThreadId) ?? threads[0];

  const needs = scopeNeeds(scope);

  const current = useMemo(() => {
    void revision;
    return readCurrentTree(
      { channel, client, thread },
      scope === 'all' ? undefined : scope,
    );
  }, [channel, client, scope, revision, thread]);

  const reseed = useCallback(() => {
    setDraft(formatTree(current.tree));
    setSeed(current.tree);
    setReport(null);
  }, [current]);

  // Re-seed when the scope changes (key, channel or thread) or when the tree is reset. Deliberately not
  // on every `revision` bump: that would overwrite whatever the user is typing the moment any config
  // changed elsewhere.
  useEffect(() => {
    const { tree } = readCurrentTree(
      { channel, client, thread },
      scope === 'all' ? undefined : scope,
    );
    setDraft(formatTree(tree));
    setSeed(tree);
    setReport(null);
  }, [channel, channelType, client, scope, thread]);

  useEffect(() => {
    const unsubscribes = INSTANCE_CONFIG_TREE_KEYS.map((key) =>
      client.config.getConfigState(key).subscribe(() => {
        // Deferred: instances subscribe to these same stores, and subscriber order decides who runs
        // first. Without the defer we would re-read before the instance has re-derived, and report a
        // value that is one Apply behind.
        queueMicrotask(() => setRevision((r) => r + 1));
      }),
    );

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [client]);

  const parsed = useMemo(() => parseTree(draft), [draft]);

  /**
   * What `client.config` actually holds, as opposed to what the editor shows.
   *
   * The editor deliberately shows *resolved* values — every knob with the value its instance ended up
   * with — because that is what you want to see and change. But that view cannot tell you which of those
   * values are yours: a `pageSize` of 100 looks identical whether you set it or the SDK did. `getTree()`
   * answers exactly that, and is the only way to ask without knowing the keys up front.
   */
  const registered = useMemo(() => {
    void revision;
    return client.config.getTree();
  }, [client, revision]);

  /**
   * Every path the SDK says exists in this scope, whether or not anything currently holds a value for it.
   *
   * This is the part that does not depend on an instance existing, which is the whole point: `thread` is
   * listed with its sub-paths before any thread has been opened, so "what can I configure here?" is
   * answerable without opening the SDK source.
   */
  const reference = useMemo(
    () => referenceRows(scope === 'all' ? undefined : scope),
    [scope],
  );

  const insertPath = useCallback(
    (path: string, value: unknown) => {
      if (!parsed.ok) return;
      setDraft(formatTree(withPath(parsed.tree, path, value)));
    },
    [parsed],
  );

  /**
   * Drops a path from the draft, which the next `Apply` turns into an unregistration.
   *
   * Not the same as setting it to a falsy value: `false` or `0` registers that value, while clearing
   * takes the registration away and lets the default show through again.
   */
  const clearPath = useCallback(
    (path: string) => {
      if (!parsed.ok) return;
      const segments = path.split('.');
      const prune = (node: Plain, depth: number): Plain => {
        const key = segments[depth];
        if (!(key in node)) return node;
        const rest = { ...node };
        if (depth === segments.length - 1) delete rest[key];
        else {
          const child = rest[key];
          if (child && typeof child === 'object' && !Array.isArray(child)) {
            const pruned = prune(child as Plain, depth + 1);
            if (Object.keys(pruned).length === 0) delete rest[key];
            else rest[key] = pruned;
          }
        }
        return rest;
      };
      setDraft(formatTree(prune(parsed.tree, 0)));
    },
    [parsed],
  );

  /**
   * Unregisters paths the editor no longer has, by replaying the key without them.
   *
   * `client.config` has no subtraction primitive — `set` and `setConfig` deep-merge, and the only thing
   * that removes anything is `reset(key)`, which clears the whole key. So "unregister one path" has to be
   * spelled read-the-key, reset it, register the survivors. That is a real gap in the SDK surface, not a
   * quirk of this app: any settings UI that lets you clear a value has to write this.
   *
   * `reset(key)` also tears down the key's setup function, which a deletion has no business touching, so
   * it is read first and reinstalled after. Doing so is only possible because `getSetupFunction` exists;
   * without it this workaround would silently destroy tier-2 registrations.
   */
  const unregister = useCallback(
    (paths: readonly string[]) => {
      const registeredNow = client.config.getTree() as Plain;
      const byKey = new Map<TreeKey, string[]>();

      for (const path of paths) {
        const [key, ...rest] = path.split('.');
        // A first segment that is not a configuration key cannot have registered anything, so there
        // is nothing to take away — skip rather than hand the registry a key it does not accept.
        if (!rest.length || !isTreeKey(key)) continue;
        byKey.set(key, [...(byKey.get(key) ?? []), rest.join('.')]);
      }

      const unregistered: string[] = [];

      for (const [key, relativePaths] of byKey) {
        const subtree = registeredNow[key];
        if (!isPlainObject(subtree)) continue;

        // Only paths this key actually registered. Deleting a line that was showing a default is not a
        // removal — there is nothing to take away, and saying otherwise would claim an effect that the
        // resolved value (still the default) plainly contradicts.
        const held = relativePaths.filter((path) => hasPathValue(subtree, path));
        if (!held.length) continue;

        const survivors = omitPaths(subtree, held);
        // Setup functions exist only for the built-in instances, a subset of the config tree keys —
        // `reset` clears one, so preserve it across the reset when this key can have one at all.
        const setupKey = isSetupKey(key) ? key : undefined;
        const setupFunction = setupKey ? client.config.getSetupFunction(setupKey) : null;

        client.config.reset(key);
        if (Object.keys(survivors).length) {
          client.config.setConfig(key, survivors as never);
        }
        if (setupKey && setupFunction) {
          client.config.setSetupFunction(setupKey, setupFunction);
        }

        unregistered.push(...held.map((path) => `${key}.${path}`));
      }

      return unregistered;
    },
    [client],
  );

  const apply = useCallback(() => {
    if (!parsed.ok) return;

    const changed = pickChanged(parsed.tree, seed);
    const removed = removedPaths(seed, parsed.tree);
    const problems: string[] = [];

    if (Object.keys(changed).length === 0 && removed.length === 0) {
      setReport({
        at: Date.now(),
        headline:
          'Nothing to apply — the editor matches what the instances already resolved to.',
        problems: [],
      });
      return;
    }

    // Removals first: unregistering replays the key, so doing it afterwards would drop the values this
    // same Apply had just registered.
    const unregistered = unregister(removed);
    client.config.set(changed as ConfigTreePatch);

    // Kept out of `problems` on purpose. Clearing a path that was only ever showing a default is not a
    // failure — nothing was asked for and nothing broke — so it must not drag the headline into saying
    // something did not take effect.
    const clearedNothing = removed.filter((path) => !unregistered.includes(path));

    // Re-read after applying and compare, rather than assuming it landed. Server authority, tier-2 setup
    // functions and construction-only paths all silently keep the old value.
    const after = readCurrentTree(
      { channel, client, thread },
      scope === 'all' ? undefined : scope,
    );
    const { judged, rejected } = diffAgainstCurrent(changed, after.tree);

    for (const { path, requested, resulting } of rejected) {
      problems.push(
        `${path}: asked for ${JSON.stringify(requested)}, still ${JSON.stringify(resulting)}`,
      );
    }

    const constructionOnly = findConstructionOnlyPaths(changed);
    if (constructionOnly.length) {
      problems.push(
        `read only at construction, so instances already built keep their value: ${constructionOnly.join(', ')}`,
      );
    }
    if (parsed.unknownKeys.length) {
      problems.push(
        `not a built-in key, so nothing reads it unless you registered an instance against it: ${parsed.unknownKeys.join(', ')}`,
      );
    }

    if (unregistered.length) {
      // An unregistered path does not vanish — the instance falls back to its default and still reports a
      // value. Leaving the deleted line off the screen would show it as unset when it is not, so the
      // editor is re-seeded from what was actually read back.
      setDraft(formatTree(after.tree));
      setSeed(after.tree);
    } else {
      // What is on screen is the new baseline, so a second Apply with no edits is correctly a no-op
      // rather than re-registering the same values.
      setSeed(parsed.tree);
    }

    const nothingToVerifyAgainst = judged === 0 && !unregistered.length;
    const parts: string[] = [];

    if (unregistered.length) {
      parts.push(`Unregistered ${unregistered.join(', ')} — now back to the default.`);
    }
    if (clearedNothing.length) {
      parts.push(
        `${clearedNothing.join(', ')} ${clearedNothing.length === 1 ? 'was' : 'were'} already showing a default — nothing was registered there to clear.`,
      );
    }
    if (Object.keys(changed).length && !problems.length && !nothingToVerifyAgainst) {
      parts.push('Every path read back with the value you asked for.');
    }
    if (nothingToVerifyAgainst && Object.keys(changed).length) {
      parts.push(
        'Registered, but no instance holds these paths yet, so this cannot confirm they took effect — they will apply to instances built from now on.',
      );
    }
    if (problems.length) parts.push('Some paths did not take effect:');

    setReport({
      at: Date.now(),
      headline: parts.join(' ') || 'Applied.',
      problems,
    });
  }, [channel, client, scope, parsed, seed, thread, unregister]);

  const reset = useCallback(() => {
    client.config.reset();
    setReport({
      at: Date.now(),
      headline: 'Reset. Both tiers cleared; every instance re-derived its configuration.',
      problems: [],
    });
    // Re-read after the reset so the editor shows what instances fell back to.
    queueMicrotask(() => {
      const { tree } = readCurrentTree(
        { channel, client, thread },
        scope === 'all' ? undefined : scope,
      );
      setDraft(formatTree(tree));
      setSeed(tree);
    });
  }, [channel, client, scope, thread]);

  const registeredKeyCount = Object.keys(registered).length;
  const registeredSummary =
    registeredKeyCount === 0
      ? 'nothing yet'
      : `${registeredKeyCount} ${registeredKeyCount === 1 ? 'key' : 'keys'}`;

  const sharedInScope = SHARED_KEYS.filter((key) => scope === 'all' || scope === key);

  return (
    <div className='app__settings-modal__content-stack'>
      <SettingsTabLayoutHeader
        close={close}
        description='The live configuration tree, with the value every knob currently resolves to. Edit and apply through client.config.set().'
        title='Configuration'
      />

      <SettingsTabBody>
        <div className='app__settings-modal__field'>
          <div className='app__settings-modal__field-label'>Scope</div>
          <div className='app__settings-modal__field-comment'>
            One button per key of the tree, listed by the SDK itself (
            <code>INSTANCE_CONFIG_TREE_KEYS</code>) rather than by a list kept here — so a
            key added to the SDK shows up without this tab being touched. Keys name the{' '}
            <em>entity type</em> that consumes the configuration, which is why reminders
            live under <code>client</code> while the composer is a key of its own.
          </div>
          <div className='app__settings-modal__options-row'>
            {(['all', ...INSTANCE_CONFIG_TREE_KEYS] as const).map((key) => (
              // Outline + `aria-pressed`, like every other tab. Swapping to solid/primary when selected
              // looked stronger but failed contrast in dark mode: Stream's pressed `::after` *lightens* a
              // solid primary, so white-on-blue measured 2.47:1 there, under the 4.5:1 AA needs. The
              // outline form is tinted by the same `::after` and measures 11.22:1 light / 5.49:1 dark.
              <Button
                appearance='outline'
                aria-pressed={scope === key}
                className='app__settings-modal__option-button'
                key={key}
                onClick={() => setScope(key)}
                size='sm'
                variant='secondary'
              >
                {scopeLabel(key)}
              </Button>
            ))}
          </div>
        </div>

        {needs.channel && channelTypes.length > 0 && (
          <div className='app__settings-modal__field'>
            <div className='app__settings-modal__field-label'>Channel type</div>
            <div className='app__settings-modal__field-comment'>
              What you register applies to <strong>every</strong> channel and composer.
              Resolved values can still differ by channel <em>type</em>, because
              server-side channel config — the thing that can veto a declarative value —
              is keyed by type. Two channels of the same type resolve identically, so this
              picks a type, not a channel.
            </div>
            <SearchableSelect
              onChange={setSelectedType}
              options={channelTypes.map((type) => ({ label: type, value: type }))}
              searchPlaceholder='Search channel types'
              value={channelType}
            />
          </div>
        )}

        {needs.thread && (
          <div className='app__settings-modal__field'>
            <div className='app__settings-modal__field-label'>Thread</div>
            <div className='app__settings-modal__field-comment'>
              {threads.length === 0 ? (
                <>
                  No thread is loaded, so there are no resolved values to show. The{' '}
                  <code>thread</code> paths are still listed under Reference below and can
                  still be registered — they apply to every thread built from now on.
                </>
              ) : (
                <>
                  Only a read sample: registering applies to <strong>every</strong>{' '}
                  thread. A thread has to be loaded for there to be a resolved value at
                  all, which is the only reason this picker exists.
                </>
              )}
            </div>
            {threads.length > 0 && (
              <SearchableSelect
                onChange={setSelectedThreadId}
                options={threads.map((candidate) => ({
                  label: candidate.id,
                  value: candidate.id,
                }))}
                searchPlaceholder='Search loaded threads'
                value={thread?.id ?? ''}
              />
            )}
          </div>
        )}

        <div className='app__settings-modal__field app__configuration-tab__editor'>
          <div className='app__settings-modal__field-label'>{scopeLabel(scope)}</div>
          <div className='app__settings-modal__field-comment'>
            <p>
              What the live instances resolved to
              {needs.channel && channelType && (
                <>
                  {' '}
                  for channel type <code>{channelType}</code>
                </>
              )}
              . Editing here changes nothing until you press <strong>Apply</strong>.
            </p>
            {current.functionsOmitted > 0 && (
              <p>
                {current.functionsOmitted}{' '}
                {current.functionsOmitted === 1 ? 'setting holds' : 'settings hold'} a
                function rather than a value. JSON cannot carry a function, so{' '}
                {current.functionsOmitted === 1 ? 'it is' : 'they are'} not shown here and{' '}
                <strong>Apply</strong> leaves{' '}
                {current.functionsOmitted === 1 ? 'it' : 'them'} untouched.
              </p>
            )}
            {sharedInScope.length > 0 && (
              <p>
                {sharedInScope.map((key, index) => (
                  <span key={key}>
                    {index > 0 && (index === sharedInScope.length - 1 ? ' and ' : ', ')}
                    <code>{key}</code>
                  </span>
                ))}{' '}
                {sharedInScope.length === 1 ? 'is read' : 'are read'} by every parent at
                once, so no single instance owns{' '}
                {sharedInScope.length === 1 ? 'its' : 'their'} value — which is why{' '}
                {sharedInScope.length === 1 ? 'it is' : 'they are'} missing above.
                Register {sharedInScope.length === 1 ? 'it' : 'them'} under{' '}
                <strong>Reference</strong> below, then look at any parent to see the
                effect.
              </p>
            )}
          </div>
          <details className='app__configuration-tab__raw'>
            <summary>Edit as JSON</summary>
            <div className='app__settings-modal__field-comment'>
              <p>
                The same values as below, in one editable document — useful for pasting a
                whole tree in or out. Editing either place updates the other.
              </p>
            </div>
            <textarea
              className='app__configuration-tab__textarea'
              onChange={(event) => setDraft(event.target.value)}
              rows={20}
              spellCheck={false}
              value={draft}
            />
          </details>
          {!parsed.ok && (
            <div className='app__configuration-tab__error'>{parsed.error}</div>
          )}

          <details className='app__configuration-tab__registered' open>
            <summary>Reference — every path in this scope ({reference.length})</summary>
            <div className='app__settings-modal__field-comment'>
              Straight from <code>INSTANCE_CONFIG_TREE_SHAPE</code>, so it lists what
              exists rather than what happens to have a value right now. <em>Add</em> puts
              the path into the editor with a starting value of the right type.
            </div>
            <ul className='app__configuration-tab__reference'>
              {reference.map((row) => (
                <li
                  className='app__configuration-tab__reference-row'
                  key={row.path}
                  style={{ paddingInlineStart: `${row.depth * 12}px` }}
                >
                  <div className='app__configuration-tab__reference-head'>
                    <code>{row.path}</code>
                    <span className='app__configuration-tab__reference-type'>
                      {row.type}
                    </span>
                    {row.constructionOnly && (
                      <span className='app__configuration-tab__reference-flag'>
                        construction-only
                      </span>
                    )}
                    {row.kind === 'value' && row.insertValue === undefined && (
                      <span className='app__configuration-tab__reference-flag'>
                        setup function only
                      </span>
                    )}
                    {row.insertValue !== undefined && parsed.ok && (
                      <ReferenceValueEditor
                        onClear={() => clearPath(row.path)}
                        onSet={(value) => insertPath(row.path, value)}
                        row={row}
                        tree={parsed.tree}
                      />
                    )}
                  </div>
                  <div className='app__configuration-tab__reference-description'>
                    {row.description}
                  </div>
                </li>
              ))}
            </ul>
          </details>

          <details className='app__configuration-tab__registered'>
            <summary>
              What you registered, not what resolved —{' '}
              <code>client.config.getTree()</code> ({registeredSummary})
            </summary>
            <div className='app__settings-modal__field-comment'>
              <p>
                Everything above is what the instances <em>resolved to</em>. This is the
                much smaller set you actually registered; everything else in the resolved
                tree came from SDK defaults, the server, or a setup function.
              </p>
              <p>
                <em>
                  {registeredSummary === 'nothing yet' ? 'Nothing yet' : 'Non-empty'}
                </em>{' '}
                {registeredSummary === 'nothing yet'
                  ? 'means every value above is a default — nothing has been registered on this client.'
                  : 'means Apply or a setup function has registered these keys. Reset all empties it.'}
              </p>
            </div>
            <textarea
              className='app__configuration-tab__textarea'
              readOnly
              rows={Math.min(14, formatTree(registered).split('\n').length)}
              spellCheck={false}
              value={formatTree(registered)}
            />
          </details>
          {report && (
            <div
              className={`app__configuration-tab__notice app__configuration-tab__notice--${
                report.problems.length ? 'warning' : 'info'
              }`}
              key={report.at}
            >
              <div>{report.headline}</div>
              {report.problems.length > 0 && (
                <ul className='app__configuration-tab__report-list'>
                  {report.problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </SettingsTabBody>
      <SettingsTabFooter>
        <div className='app__settings-modal__options-row'>
          <Button
            // `variant` alone paints nothing: every colour rule in the SDK's `Button.scss` is keyed on an
            // appearance *and* a variant pair (`.str-chat__button--solid.str-chat__button--primary`), and
            // `appearance` has no default — omitting it emits no appearance class, so the button matched no
            // rule and rendered as unstyled black-on-transparent.
            appearance='solid'
            className='app__settings-modal__option-button'
            disabled={!parsed.ok}
            onClick={apply}
            title='Register what you changed and unregister what you cleared'
            size='sm'
            variant='primary'
          >
            Apply
          </Button>
          <Button
            appearance='outline'
            className='app__settings-modal__option-button'
            onClick={reseed}
            title='Re-read the live values, throwing away edits you have not applied'
            size='sm'
            variant='secondary'
          >
            Reload
          </Button>
          <Button
            appearance='outline'
            className='app__settings-modal__option-button'
            onClick={reset}
            title='Clear everything registered through client.config and re-derive'
            size='sm'
            variant='secondary'
          >
            Reset all
          </Button>
        </div>
        <p className='app__settings-modal__tab-footer__hint'>
          <strong>Apply</strong> registers what you changed and unregisters what you
          cleared. <strong>Reload</strong> discards unapplied edits;{' '}
          <strong>Reset all</strong> unregisters everything at once.
        </p>
      </SettingsTabFooter>
    </div>
  );
};
