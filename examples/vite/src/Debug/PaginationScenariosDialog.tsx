import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Channel } from 'stream-chat';
import {
  Button,
  Prompt,
  useChatContext,
  useDialogIsOpen,
  useStateStore,
} from 'stream-chat-react';
import { useChatViewNavigation } from 'stream-chat-react/slot-layout';

import { DraggableDialog } from '../AppSettings/ActionsMenu/DraggableDialog';
import { MAIN_CHANNEL_SLOT } from '../ChatLayout/constants';
import { usePersistentDialog } from '../AppSettings/ActionsMenu/usePersistentDialog';
import type { FakeBackendState, FakeChannelBackend } from './fakeChannelBackend';
import { ingestUnsentMessage } from './fakeChannelBackend';
import type {
  CheckResult,
  Scenario,
  ScenarioRunState,
  ScenarioStep,
  StepStatus,
} from './paginationScenarios';
import {
  numberedTitle,
  scenarioGroups,
  ScenarioRun,
  scenarios,
} from './paginationScenarios';
import { PaginatorInspector, PaginatorWindows } from './PaginatorInspector';
import type { ScenarioChannelInApp } from './scenarioChannel';
import { watchWindowChanges } from './windowChangeLog';
import {
  ensureScenarioChannel,
  SCENARIO_CHANNEL_CID,
  untilActive,
} from './scenarioChannel';

export const paginationScenariosDialogId = 'app-pagination-scenarios-dialog';

/** Same registration rule as the composer inspector: see `usePersistentDialog`. */
export const usePaginationScenariosDialog = () =>
  usePersistentDialog(paginationScenariosDialogId);

const MAX_LOG_LINES = 300;
const MAX_AUTOMATIC_CREATION_ATTEMPTS = 3;

/** Whether `error` is a channel refusing to work because it was disposed of. */
const isDisposalError = (error: unknown) =>
  error instanceof Error && error.message.includes('pending disposal');

const backendSelector = (state: FakeBackendState) => ({ ...state });
const runSelector = (state: ScenarioRunState) => ({ ...state });
const connectionSelector = (state: { isHealthy: boolean }) => ({
  isConnected: state.isHealthy,
});

type Log = (line: string) => void;
type RunAction = (label: string, action: () => unknown) => void;

const PRECONDITION_LABEL = {
  closed: 'runs with the test channel closed',
  open: 'runs with the test channel open',
} as const;

/** Opens the test channel in the channels view's main panel, or closes that panel. */
const useScenarioChannelInApp = (channel: Channel): ScenarioChannelInApp => {
  const { open, openView, release } = useChatViewNavigation();
  return useMemo(
    () => ({
      close: async () => {
        if (channel.active) release(MAIN_CHANNEL_SLOT);
        await untilActive(channel, false);
      },
      open: async () => {
        openView('channels');
        open(
          { key: channel.cid, kind: 'channel', source: channel },
          { slot: MAIN_CHANNEL_SLOT },
        );
        await untilActive(channel, true);
      },
    }),
    [channel, open, openView, release],
  );
};

const Toolbar = ({ children }: { children: ReactNode }) => (
  <div className='app__pagination-scenarios__toolbar'>{children}</div>
);

const Section = ({
  children,
  docked,
  open = true,
  title,
}: {
  children: ReactNode;
  /** Kept at the bottom of the dialog, its content scrolling under the title. */
  docked?: boolean;
  open?: boolean;
  title: string;
}) => (
  <details
    className={`app__composer-inspector__section${docked ? ' app__pagination-scenarios__docked' : ''}`}
    open={open}
  >
    <summary className='app__composer-inspector__section-title'>{title}</summary>
    {children}
  </details>
);

const ActionButton = ({
  disabled,
  label,
  onClick,
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) => (
  <Button
    appearance='outline'
    disabled={disabled}
    onClick={onClick}
    size='sm'
    variant='secondary'
  >
    {label}
  </Button>
);

/** Collapsed to its gist, so the scenarios keep the dialog's height. */
const Intro = () => (
  <details className='app__pagination-scenarios__intro'>
    <summary>
      Open a scenario and press <strong>Step</strong> or <strong>Run all</strong>. It runs
      on a test channel answered by a fake server.
    </summary>
    <p>
      The message list keeps loaded messages in <strong>windows</strong>: stretches of
      messages with nothing missing in between. Several can be loaded at once (say the
      head plus a stretch you jumped to) and one is shown. The test channel exists only in
      this tab, and a scenario opens or closes it in the app as it needs.
    </p>
  </details>
);

// ---- scenarios -------------------------------------------------------------------------------

const Checks = ({ results }: { results: CheckResult[] | undefined }) =>
  results?.length ? (
    <ul className='app__pagination-scenarios__checks'>
      {/* a step's checks and the scenario's are judged together, so a text can repeat */}
      {results.map(({ ok, text }, index) => (
        <li
          className={`app__pagination-scenarios__check--${ok ? 'ok' : 'fail'}`}
          key={`${index}. ${text}`}
        >
          {ok ? '✓' : '✗'} {text}
        </li>
      ))}
    </ul>
  ) : null;

/** `next`: the step Step runs, before it starts. */
type StepDisplay = StepStatus | 'next';

const StepItem = ({
  results,
  status,
  step,
}: {
  results?: CheckResult[];
  status: StepDisplay;
  step: ScenarioStep;
}) => (
  <li
    className={`app__pagination-scenarios__step app__pagination-scenarios__step--${status}`}
  >
    {step.label}
    {step.youDo && (status === 'todo' || status === 'next') && (
      <span className='app__composer-inspector__empty'> (you)</span>
    )}
    {status === 'yourTurn' && (
      <div className='app__pagination-scenarios__your-turn'>
        Your turn: {step.youDo}{' '}
        {step.run ? 'Or press Step to do it for you.' : 'Press Step when done.'}
      </div>
    )}
    <Checks results={results} />
  </li>
);

const Fact = ({ label, text }: { label: string; text: string }) => (
  <>
    <dt>{label}</dt>
    <dd>{text}</dd>
  </>
);

/**
 * A scenario's story, its steps with their progress and check results, its controls, and while
 * open the channel's windows, so each step's effect shows next to it.
 */
const ScenarioCard = ({
  channel,
  onReset,
  onRunAll,
  onStep,
  run,
  scenario,
}: {
  channel: Channel;
  onReset: () => void;
  onRunAll: () => void;
  onStep: () => void;
  run?: ScenarioRun;
  scenario: Scenario;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const runState = useStateStore(run?.state, runSelector);
  const { current = 0, error, results = [], statuses = [] } = runState ?? {};
  const isFinished = current >= scenario.steps.length;
  const isRunning = statuses.includes('running');
  const checks = results.flat();
  const failed = checks.filter((check) => !check.ok).length;

  return (
    <li className='app__pagination-scenarios__card'>
      <details onToggle={(event) => setIsOpen(event.currentTarget.open)}>
        <summary className='app__pagination-scenarios__card-title'>
          <strong>{numberedTitle(scenario)}</strong>
          {scenario.precondition && (
            <span className='app__pagination-scenarios__badge'>
              {PRECONDITION_LABEL[scenario.precondition]}
            </span>
          )}
          {runState && (
            <span className='app__pagination-scenarios__badge'>
              {isFinished ? 'done' : `step ${current + 1} of ${scenario.steps.length}`}
            </span>
          )}
        </summary>
        <dl className='app__pagination-scenarios__facts'>
          <Fact label='Situation' text={scenario.situation} />
          <Fact label='Rule' text={scenario.rule} />
          <Fact label='Look for' text={scenario.lookFor} />
          <Fact label='Bug it prevents' text={scenario.bugPrevented} />
        </dl>
        <ol className='app__pagination-scenarios__steps'>
          {scenario.steps.map((step, index) => (
            <StepItem
              // a scenario may repeat a step, e.g. loading older twice
              key={`${index}. ${step.label}`}
              results={results[index]}
              status={
                runState && index === current && statuses[index] === 'todo'
                  ? 'next'
                  : (statuses[index] ?? 'todo')
              }
              step={step}
            />
          ))}
        </ol>
        {isFinished && (
          <div className={`app__pagination-scenarios__check--${failed ? 'fail' : 'ok'}`}>
            {failed
              ? `${failed} of ${checks.length} checks failed.`
              : `All ${checks.length} checks pass.`}
          </div>
        )}
        {error && <div className='app__pagination-scenarios__warning'>⚠ {error}</div>}
        <Toolbar>
          <ActionButton
            disabled={isFinished || isRunning}
            label='Step'
            onClick={onStep}
          />
          <ActionButton
            disabled={isFinished || isRunning}
            label='Run all'
            onClick={onRunAll}
          />
          {runState && <ActionButton label='Start over' onClick={onReset} />}
        </Toolbar>
        {isOpen && (
          <div className='app__pagination-scenarios__windows'>
            <strong>Windows now</strong>
            <PaginatorWindows channel={channel} />
          </div>
        )}
      </details>
    </li>
  );
};

/** One run at a time: the backend is shared, so starting a scenario ends the current run. */
const Scenarios = ({
  app,
  backend,
  log,
}: {
  app: ScenarioChannelInApp;
  backend: FakeChannelBackend;
  log: Log;
}) => {
  const { channel } = backend;
  const [run, setRun] = useState<ScenarioRun>();

  useEffect(() => () => run?.dispose(), [run]);

  const runOf = (scenario: Scenario) => {
    if (run?.scenario === scenario) return run;
    const next = new ScenarioRun(scenario, { app, backend, channel, log });
    setRun(next);
    return next;
  };

  /** Ends the run and empties the test channel, so the list and its windows start over too. */
  const startOver = () => {
    setRun(undefined);
    log('start over: clear the test channel');
    backend.clear().catch((error: unknown) => log(`start over failed: ${String(error)}`));
  };

  return (
    <>
      {scenarioGroups.map((group) => {
        const inGroup = scenarios.filter((scenario) => scenario.group === group.id);
        return (
          <details className='app__pagination-scenarios__group' key={group.id}>
            <summary className='app__pagination-scenarios__group-title'>
              {group.title}{' '}
              <span className='app__composer-inspector__empty'>({inGroup.length})</span>
            </summary>
            <ul className='app__pagination-scenarios__cards'>
              {inGroup.map((scenario) => (
                <ScenarioCard
                  channel={channel}
                  key={scenario.id}
                  onReset={() => startOver()}
                  onRunAll={() => void runOf(scenario).runAll()}
                  onStep={() => void runOf(scenario).step()}
                  run={run?.scenario === scenario ? run : undefined}
                  scenario={scenario}
                />
              ))}
            </ul>
          </details>
        );
      })}
    </>
  );
};

// ---- answers and manual controls -------------------------------------------------------------

const HeldAnswers = ({
  backend,
  state,
}: {
  backend: FakeChannelBackend;
  state: FakeBackendState;
}) => (
  <>
    <p className='app__composer-inspector__empty'>
      A race scenario holds the server&apos;s answer on purpose, so you have time to do
      the second action before the first request finishes. Releasing it lets the slow
      request finish: <strong>Release next</strong> the oldest one,{' '}
      <strong>Release all</strong> every one.
    </p>
    {state.pending.map(({ id, label }) => (
      <Toolbar key={id}>
        <span className='app__pagination-scenarios__wrap'>
          #{id} {label}
        </span>
        <ActionButton label='Release' onClick={() => backend.release(id)} />
      </Toolbar>
    ))}
    <Toolbar>
      {!state.pending.length && (
        <span className='app__composer-inspector__empty'>Nothing held.</span>
      )}
      <ActionButton
        disabled={!state.pending.length}
        label='Release next'
        onClick={() => backend.release()}
      />
      <ActionButton
        disabled={!state.pending.length}
        label='Release all'
        onClick={() => backend.releaseAll()}
      />
    </Toolbar>
  </>
);

/** The fake server's timeline, connection and answers, and the client's own actions, by hand. */
const ManualControls = ({
  backend,
  run,
  state,
}: {
  backend: FakeChannelBackend;
  run: RunAction;
  state: FakeBackendState;
}) => {
  const { channel } = backend;
  const paginator = channel.messagePaginator;
  const [count, setCount] = useState(10);
  const [messageId, setMessageId] = useState('');
  const newestId = state.timeline[state.timeline.length - 1]?.id;

  return (
    <>
      <Toolbar>
        <span>
          Server timeline: {state.timeline.length} messages (
          {state.timeline[0]?.id ?? '—'} … {newestId ?? '—'})
        </span>
        <label>
          <input
            checked={state.online}
            onChange={(event) => backend.setOnline(event.target.checked)}
            type='checkbox'
          />{' '}
          online (events arrive)
        </label>
      </Toolbar>
      <Toolbar>
        <input
          aria-label='Message count'
          className='app__pagination-scenarios__number'
          min={1}
          onChange={(event) => setCount(Number(event.target.value) || 1)}
          type='number'
          value={count}
        />
        <ActionButton
          label={`Seed ${count} + reload`}
          onClick={() =>
            run(`seed ${count} + reopen`, () => {
              backend.seed(count);
              return backend.reopen();
            })
          }
        />
        <ActionButton
          label={`Add ${count}`}
          onClick={() =>
            run(`add ${count} ${state.online ? 'with' : 'without'} events`, () =>
              backend.addMessages(count),
            )
          }
        />
        <ActionButton
          label='Truncate'
          onClick={() => run('truncate timeline (no event)', () => backend.truncate())}
        />
        <ActionButton
          label='Failed msg'
          onClick={() =>
            run('add failed message', () => ingestUnsentMessage(channel, 'failed'))
          }
        />
        <ActionButton
          label='Sending msg'
          onClick={() =>
            run('add sending message', () => ingestUnsentMessage(channel, 'sending'))
          }
        />
      </Toolbar>
      <Toolbar>
        <input
          aria-label='Message id'
          className='app__composer-inspector__picker app__pagination-scenarios__id'
          onChange={(event) => setMessageId(event.target.value.trim())}
          placeholder={newestId ? `message id (default ${newestId})` : 'message id'}
          value={messageId}
        />
        <ActionButton
          label='Hard delete'
          onClick={() =>
            run(`hard delete ${messageId || newestId} (no event)`, () =>
              backend.hardDelete(messageId || undefined),
            )
          }
        />
        <ActionButton
          disabled={!messageId}
          label='Jump to'
          onClick={() =>
            run(`jump to ${messageId}`, () => paginator.jumpToMessage(messageId))
          }
        />
      </Toolbar>
      <Toolbar>
        <ActionButton
          label='Reload'
          onClick={() => run('channel.reload()', () => channel.reload())}
        />
        <ActionButton
          label='Channel-list refresh'
          onClick={() =>
            run('channel-list refresh', () => backend.refreshFromChannelList())
          }
        />
        <ActionButton
          label='Load older'
          onClick={() => run('load older', () => paginator.toTail())}
        />
        <ActionButton
          label='Load newer'
          onClick={() => run('load newer', () => paginator.toHead())}
        />
        <ActionButton
          label='Jump to latest'
          onClick={() => run('jump to latest', () => paginator.jumpToTheLatestMessage())}
        />
      </Toolbar>
      <Toolbar>
        <label>
          answer delay{' '}
          <input
            aria-label='Answer delay in milliseconds'
            className='app__pagination-scenarios__number'
            min={0}
            onChange={(event) => backend.setDelayMs(Number(event.target.value))}
            step={100}
            type='number'
            value={state.delayMs}
          />{' '}
          ms
        </label>
        <label>
          <input
            checked={state.holdAnswers}
            onChange={(event) => backend.setHoldAnswers(event.target.checked)}
            type='checkbox'
          />{' '}
          hold answers
        </label>
      </Toolbar>
    </>
  );
};

/**
 * Which stream-chat build the app runs. The scenarios test the pagination fixes, which only a
 * build of a local stream-chat-js checkout (`STREAM_CHAT_JS_PATH`) has; a published package
 * without them fails scenarios for reasons the dialog cannot fix.
 */
const SdkBuildNote = ({ channel }: { channel: Channel }) => {
  const version = /stream-chat-js-v?(v[^-|]+(?:-rc\.\d+)?)/.exec(
    channel.getClient().getUserAgent(),
  )?.[1];
  const hasFixes =
    typeof (channel.messagePaginator as unknown as Record<string, unknown>)
      .getHeadIntervalItemIdsAtRequest === 'function';
  return hasFixes ? (
    <div className='app__composer-inspector__empty'>
      stream-chat {version}: a build with the pagination fixes
    </div>
  ) : (
    <div className='app__pagination-scenarios__warning'>
      ⚠ stream-chat {version} has no pagination fixes, so scenarios fail. Point
      STREAM_CHAT_JS_PATH (examples/vite/.env) at a built stream-chat-js checkout and
      restart the dev server.
    </div>
  );
};

const BackendPanel = ({ backend, log }: { backend: FakeChannelBackend; log: Log }) => {
  const state = useStateStore(backend.state, backendSelector);
  const { channel } = backend;
  const app = useScenarioChannelInApp(channel);
  // A new key mounts the scenario cards afresh, ending any run, once the channel is cleared.
  const [clearCount, setClearCount] = useState(0);

  useEffect(() => watchWindowChanges(channel, log), [channel, log]);

  const run: RunAction = useCallback(
    (label, action) => {
      log(label);
      Promise.resolve()
        .then(action)
        .catch((error: unknown) => log(`${label} failed: ${String(error)}`));
    },
    [log],
  );

  return (
    <>
      <SdkBuildNote channel={channel} />
      <Toolbar>
        <span>
          Test channel: {SCENARIO_CHANNEL_CID} ({state.online ? 'online' : 'offline'})
        </span>
        <ActionButton
          label='Open in app'
          onClick={() => run('open the test channel', app.open)}
        />
        <ActionButton
          label='Clear'
          onClick={() =>
            run('clear the test channel', async () => {
              await backend.clear();
              setClearCount((count) => count + 1);
            })
          }
        />
      </Toolbar>
      {/* The only part that scrolls: the test channel row above and the docked sections below
          stay in view. */}
      <div className='app__pagination-scenarios__scroll-area'>
        <Section title='Scenarios'>
          <Scenarios app={app} backend={backend} key={clearCount} log={log} />
        </Section>
        <Section title={`Held answers (${state.pending.length})`}>
          <HeldAnswers backend={backend} state={state} />
        </Section>
        <Section title='Windows (message paginator)'>
          <PaginatorInspector channel={channel} />
        </Section>
      </div>
      <Section docked open={false} title='Manual controls'>
        <ManualControls backend={backend} run={run} state={state} />
      </Section>
    </>
  );
};

/**
 * Drives the fake channel backend (`fakeChannelBackend.ts`) through the pagination scenarios on a
 * local test channel (`scenarioChannel.ts`) and shows its message windows, so the SDK's pagination
 * can be watched against gaps, deletes and racing answers.
 */
export const PaginationScenariosDialog = ({
  referenceElement,
}: {
  referenceElement: HTMLElement | null;
}) => {
  const { client } = useChatContext();
  const { dialog, dialogManager } = usePaginationScenariosDialog();
  const dialogIsOpen = useDialogIsOpen(paginationScenariosDialogId, dialogManager?.id);
  const [testChannel, setTestChannel] =
    useState<Awaited<ReturnType<typeof ensureScenarioChannel>>>();
  const [logLines, setLogLines] = useState<string[]>([]);

  const log = useCallback((line: string) => {
    const time = new Date().toLocaleTimeString();
    setLogLines((lines) => [`${time} ${line}`, ...lines].slice(0, MAX_LOG_LINES));
  }, []);

  const closeDialog = useCallback(() => {
    dialog.close();
  }, [dialog]);

  // Connecting the user clears the channel manager, so the test channel is created once the
  // user is connected, and replaced if it is disposed (a reconnect as another user, a logout).
  const { isConnected } = useStateStore(client.wsConnection.state, connectionSelector);
  const [creationAttempt, setCreationAttempt] = useState(0);
  const [creationFailed, setCreationFailed] = useState(false);
  // A new key per created channel, so a replacement starts with fresh panels and no old run.
  const [creationCount, setCreationCount] = useState(0);

  useEffect(() => {
    if (!dialogIsOpen || !isConnected || !client.userID || testChannel) return;
    let isCurrent = true;
    setCreationFailed(false);
    ensureScenarioChannel(client)
      .then((created) => {
        if (!isCurrent) return;
        setTestChannel(created);
        setCreationCount((count) => count + 1);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        // Disposed while it was being created (the client reconnected): start over with a new one.
        if (creationAttempt < MAX_AUTOMATIC_CREATION_ATTEMPTS && isDisposalError(error)) {
          setCreationAttempt((attempt) => attempt + 1);
          return;
        }
        log(`creating the test channel failed: ${String(error)}`);
        setCreationFailed(true);
      });
    return () => {
      isCurrent = false;
    };
  }, [client, creationAttempt, dialogIsOpen, isConnected, log, testChannel]);

  useEffect(() => {
    if (!testChannel) return;
    return testChannel.channel.state.subscribeWithSelector(
      ({ pendingDisposal }) => ({ pendingDisposal }),
      ({ pendingDisposal }) => {
        if (pendingDisposal) setTestChannel(undefined);
      },
    );
  }, [testChannel]);

  return (
    <DraggableDialog
      closeOnClickOutside={false}
      closeOnEscape={false}
      dialogClassName='app__composer-inspector-dialog'
      dialogId={paginationScenariosDialogId}
      dialogIsOpen={dialogIsOpen}
      dialogManagerId={dialogManager?.id}
      dragHandleClassName='app__composer-inspector-dialog__drag-handle'
      // Non-modal, like the other debug panels, so the message list stays scrollable.
      focus={false}
      onClose={closeDialog}
      promptClassName='app__composer-inspector-dialog__prompt'
      referenceElement={referenceElement}
      shellClassName='app__pagination-scenarios-dialog__shell'
      title='Pagination scenarios'
      trapFocus={false}
    >
      <Prompt.Body className='app__composer-inspector app__pagination-scenarios'>
        <Intro />
        {testChannel ? (
          <BackendPanel backend={testChannel.backend} key={creationCount} log={log} />
        ) : creationFailed ? (
          <Toolbar>
            <span className='app__composer-inspector__empty'>
              Creating the test channel failed (see Log).
            </span>
            <ActionButton
              label='Try again'
              onClick={() => setCreationAttempt((attempt) => attempt + 1)}
            />
          </Toolbar>
        ) : (
          <div className='app__composer-inspector__empty'>
            {isConnected ? 'Creating the test channel…' : 'Waiting for the connection…'}
          </div>
        )}
        <Section docked open={false} title='Log'>
          <pre className='app__composer-inspector__json app__pagination-scenarios__wrap'>
            {logLines.join('\n')}
          </pre>
        </Section>
      </Prompt.Body>
    </DraggableDialog>
  );
};
