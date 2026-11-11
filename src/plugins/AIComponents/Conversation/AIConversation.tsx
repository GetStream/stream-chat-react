import React, {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';

import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import type { AIUIHost } from '../GenerativeUI/AIUIHost';
import { AIUIGenerated, useAIUIHostRefresh } from '../GenerativeUI/AIUIView';
import { AIAssistantMessage } from '../Message/AIAssistantMessage';
import type { AIMessageAttachmentData } from '../Message/AIMessageAttachment';
import { AIReplyActions, type AIReplyActionsProps } from '../Message/AIReplyActions';
import { AIUserMessage } from '../Message/AIUserMessage';
import type { AIMessagePartData } from '../MessageParts/types';
import { AIThinking } from '../Reasoning/AIReasoning';
import { AIThinkingClock, AIThinkingTurnContext } from '../Reasoning/thinkingClock';
import { type AIToolApprover, AIToolApproverProvider } from '../ToolCalls/AIToolApprover';
import { prefersReducedMotion, useIsomorphicLayoutEffect } from '../utils';
import {
  type AIConversationEntry,
  type AIConversationTurn,
  AIPendingMessageTracker,
  turnsOf,
} from './entries';
import type { AIMessage, AIPendingMessage } from './types';
import { ThemeScopeProvider, useAIThemeScopeClassName } from '../themeScope';
import type {
  AIConversationController,
  AIConversationControllerState,
} from './controller/AIConversationController';
import { editActionOf, latestUserMessageIdOf, replyActionsOf } from './controller/offers';
import { useAIConversationState } from './controller/useAIConversationState';

// How far from the end still counts as at the end, in pixels.
const END_SLACK = 32;
// How long the spinner above the turns stays in view before older messages load, so a list
// that opens at its end does not load for the frame its start shows.
const LOAD_OLDER_DELAY_MS = 300;
// How long to wait before asking again after loading older messages failed.
const LOAD_OLDER_RETRY_MS = 3000;

export type AIConversationUserMessageProps = {
  /** What the person sent with it, such as images and files. */
  attachments: AIMessageAttachmentData[];
  /** What the person wrote. */
  text: string;
  /** The message, or `undefined` for one on its way. */
  message?: AIMessage;
  /** Edits the message: a `conversation` offers it on the person's latest message. */
  onEdit?: () => void;
};

export type AIConversationAssistantMessageProps = {
  attachments: AIMessageAttachmentData[];
  isGenerating: boolean;
  message: AIMessage;
  parts: AIMessagePartData[];
  /**
   * Whether the UI the agent wrote for the reply shows, in place of its words, which `text` then
   * leaves out. `false` for a reply with no UI, one the conversation's `ui` host has no renderer
   * for, one whose renderer shows nothing of it, and one whose UI failed (`uiFailed`). A reply
   * that is neither generating nor showing UI, with no `text`, finished without a text reply,
   * for which a message can show a status of its own.
   */
  showsUI: boolean;
  /** What the reply says, or `''` while its UI shows in place of its words (`showsUI`). */
  text: string;
  /**
   * Whether the reply has UI that failed to show (`AIUIHost.fail`), so its words, if any, show
   * instead. The message renders again when it fails, whether or not it is memoised.
   */
  uiFailed: boolean;
  approver?: AIToolApprover;
  reasoningText?: (stepId: string) => string | undefined;
};

export type AIConversationReplyActionsProps = {
  /** Whether it is the reply that ends the conversation, which can be asked for again. */
  isLatestReply: boolean;
  message: AIMessage;
  text: string;
};

export type AIConversationProps = {
  /**
   * The conversation's state and what the person does in it, such as an
   * `AIConversationController`. The conversation shows its messages, the message on its way and
   * whether the agent thinks, loads its older messages, and offers rating and regenerating
   * replies and editing the person's latest message. It takes the place of `messages`,
   * `pendingMessage`, `isThinking` and `loadOlderMessages`, its reply actions are used unless
   * `replyActions` is passed, and its `approver` unless one is passed.
   */
  conversation?: AIConversationController;
  /** The conversation, oldest message first. Required without `conversation`. */
  messages?: AIMessage[];
  /** Who answers tool calls' questions and sign-ins on this device, to ask them. */
  approver?: AIToolApprover;
  /** The view of the agent's replies. Defaults to `AIAssistantMessage`. */
  AssistantMessage?: ComponentType<AIConversationAssistantMessageProps>;
  /**
   * Room left under the latest turn, in pixels, for a composer floating over the bottom of the
   * conversation. The question of a new turn pins to the top of what is visible above it.
   */
  bottomInset?: number;
  className?: string;
  /** What the conversation shows while there are no messages, centered in it. */
  emptyContent?: ReactNode;
  /** A view under the latest turn's messages, such as what the agent is doing, or an error with a way to retry. */
  footer?: ReactNode;
  /**
   * Whether the agent is answering the latest message and its reply shows nothing yet.
   * Meanwhile the latest turn ends with `AIThinking`, and the reply's first reasoning step takes
   * over its seconds. The conversation also knows it is while `pendingMessage` waits, and while
   * the latest reply is being written but shows nothing.
   */
  isThinking?: boolean;
  /**
   * Loads the messages before the first one, which the conversation asks for as the person
   * scrolls to its start. It shows a spinner meanwhile, and what is on screen stays in place as
   * they arrive. Pass `undefined` once there are none left.
   */
  loadOlderMessages?: () => Promise<unknown> | void;
  /**
   * A message the person sent that is not in `messages` yet. Keep passing it until its reply
   * starts: the conversation stops showing it once its copy arrives.
   */
  pendingMessage?: AIPendingMessage | null;
  /** The actions under each finished reply. Defaults to `AIReplyActions`; `null` shows none. */
  ReplyActions?: ComponentType<AIConversationReplyActionsProps> | null;
  /**
   * What the default `AIReplyActions` offers for a reply besides copy and share, such as its
   * rating and how to rate or regenerate it.
   */
  replyActions?: (
    message: AIMessage,
    context: { isLatestReply: boolean },
  ) => Omit<AIReplyActionsProps, 'text'> | undefined;
  /**
   * Shows the UI the agent writes for its replies (`AIMessage.uiDocument`) in place of their
   * text, with the renderers of the formats it writes, such as A2UI. A reply whose UI none of
   * them shows shows its text. Keep one host per conversation, for as long as it shows.
   */
  ui?: AIUIHost;
  /** The view of the person's messages. Defaults to `AIUserMessage`. */
  UserMessage?: ComponentType<AIConversationUserMessageProps>;
};

const DefaultUserMessage = ({
  attachments,
  onEdit,
  text,
}: AIConversationUserMessageProps) => (
  <AIUserMessage attachments={attachments} onEdit={onEdit} text={text} />
);

const NO_MESSAGES: AIMessage[] = [];

type EditAction = (message: AIMessage) => (() => void) | undefined;

const DefaultAssistantMessage = ({
  approver,
  attachments,
  isGenerating,
  parts,
  reasoningText,
  text,
}: AIConversationAssistantMessageProps) => (
  <AIAssistantMessage
    approver={approver}
    attachments={attachments}
    isGenerating={isGenerating}
    parts={parts}
    reasoningText={reasoningText}
    text={text}
  />
);

type EntryViewProps = {
  AssistantMessage: ComponentType<AIConversationAssistantMessageProps>;
  editAction?: EditAction;
  entry: AIConversationEntry;
  ReplyActions: ComponentType<AIConversationReplyActionsProps> | null;
  UserMessage: ComponentType<AIConversationUserMessageProps>;
  approver?: AIToolApprover;
  ui?: AIUIHost;
};

// Not memoised: an app's messages are new objects on every update while a reply streams, and a
// rating given through `replyActions` must reach the reply's actions whether or not they are.
const EntryView = ({
  approver,
  AssistantMessage,
  editAction,
  entry,
  ReplyActions,
  ui,
  UserMessage,
}: EntryViewProps) => {
  const { message, pending } = entry;
  if (!message) {
    return pending ? (
      <UserMessage attachments={pending.attachments ?? []} text={pending.text} />
    ) : null;
  }
  if (message.role === 'user') {
    return (
      <UserMessage
        attachments={
          entry.sentAttachments.length
            ? entry.sentAttachments
            : (message.attachments ?? [])
        }
        message={message}
        onEdit={editAction?.(message)}
        text={message.text}
      />
    );
  }
  // The UI the agent generated for the reply, when one of the host's renderers shows it. It
  // shows in place of the reply's text, after the reply's steps.
  const { uiDocument } = message;
  const generated = ui && uiDocument ? ui.content(uiDocument, message.id) : null;
  const showsUI = !!uiDocument && generated !== null && generated !== undefined;
  const uiFailed = !!uiDocument && !!ui?.hasFailed(message.id);
  // A finished reply has its actions under it whether it answers in text or in UI, once the
  // UI is written.
  const hasAnswer = message.text !== '' || showsUI;
  const isWritingUI = showsUI && uiDocument.isStreaming;
  return (
    <div className='str-chat__ai-conversation__reply'>
      <AssistantMessage
        approver={approver}
        attachments={message.attachments ?? []}
        isGenerating={!!message.isGenerating}
        message={message}
        parts={message.parts ?? []}
        reasoningText={message.reasoningText}
        showsUI={showsUI}
        text={showsUI ? '' : message.text}
        uiFailed={uiFailed}
      />
      {showsUI && (
        <AIUIGenerated
          isStreaming={uiDocument.isStreaming}
          onError={(error) => ui?.fail(message.id, error)}
        >
          {generated}
        </AIUIGenerated>
      )}
      {ReplyActions && !message.isGenerating && hasAnswer && !isWritingUI && (
        <ReplyActions
          isLatestReply={entry.isLatestReply}
          message={message}
          text={message.text}
        />
      )}
    </div>
  );
};

type HeldTurn = { id: string; top: number };

// The turn's first reasoning step, which takes over the seconds the turn was seen thinking.
const firstStepOf = (turn: AIConversationTurn | undefined) => {
  for (const { message } of turn?.entries ?? []) {
    if (!message || message.role === 'user') continue;
    const step = message.parts?.find((part) => part.reasoning);
    if (step) return step.id;
  }
  return undefined;
};

const scrollScroller = (scroller: HTMLElement, top: number, smooth: boolean) => {
  if (typeof scroller.scrollTo !== 'function') {
    scroller.scrollTop = top;
    return;
  }
  scroller.scrollTo({
    behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto',
    top,
  });
};

/**
 * The conversation with an AI agent, laid out by turn: each of the person's questions starts
 * a turn, with the agent's reply under it. The counterpart of `AIConversationView`.
 *
 * - A new question pins to the top of what is visible, and the reply writes out below it,
 *   without moving what is on screen. The latest turn is at least as tall as the conversation.
 * - It opens at the end; older messages load as the person scrolls to the start, and what is
 *   on screen stays in place as they arrive.
 * - A button scrolls back to the latest message when the end is out of view.
 * - A message the person sent shows at once (`pendingMessage`) and the agent thinks under it
 *   (`AIThinking`) until its reply shows something.
 *
 * With a `conversation`, such as an `AIConversationController`, it shows the conversation's
 * state and offers what the person can do in it. Without one, pass its `messages` and the rest.
 */
export const AIConversation = (props: AIConversationProps) =>
  props.conversation ? (
    <ControlledConversation {...props} conversation={props.conversation} />
  ) : (
    <ConversationView {...props} />
  );

const controlledSelector = ({
  hasOlderMessages,
  messages,
  pendingMessage,
  ratings,
  status,
}: AIConversationControllerState) => ({
  hasOlderMessages,
  messages,
  pendingMessage,
  ratings,
  status,
});

// The conversation as its controller has it. The controller knows when its agent is thinking,
// including after a stop or a failure that leaves the person's message on its way.
const ControlledConversation = ({
  conversation,
  ...props
}: AIConversationProps & { conversation: AIConversationController }) => {
  const { hasOlderMessages, messages, pendingMessage, ratings, status } =
    useAIConversationState(conversation, controlledSelector);
  const replyActions = useMemo(
    () =>
      (message: AIMessage, { isLatestReply }: { isLatestReply: boolean }) =>
        replyActionsOf(conversation, { ratings, status }, message, isLatestReply),
    [conversation, ratings, status],
  );
  const latestUserMessageId = latestUserMessageIdOf(messages);
  const editAction = useMemo<EditAction>(
    () => (message) =>
      editActionOf(conversation, { latestUserMessageId, status }, message),
    [conversation, latestUserMessageId, status],
  );
  const { ui } = props;
  // A reply that shows only its UI has started, which the controller can't tell without the
  // host that reads it.
  const last = messages[messages.length - 1];
  const showsReply =
    !!last && last.role !== 'user' && !!last.uiDocument && !!ui?.canShow(last.uiDocument);
  return (
    <ConversationView
      {...props}
      approver={props.approver ?? conversation.approver}
      editAction={editAction}
      isThinking={status === 'submitted' && !showsReply}
      isThinkingKnown
      loadOlderMessages={hasOlderMessages ? conversation.loadOlderMessages : undefined}
      messages={messages as AIMessage[]}
      pendingMessage={pendingMessage}
      replyActions={props.replyActions ?? replyActions}
    />
  );
};

type ConversationViewProps = Omit<AIConversationProps, 'conversation'> & {
  editAction?: EditAction;
  // Whether `isThinking` alone says whether the agent is thinking.
  isThinkingKnown?: boolean;
};

const ConversationView = ({
  approver,
  AssistantMessage = DefaultAssistantMessage,
  bottomInset = 0,
  className,
  editAction,
  emptyContent,
  footer,
  isThinking = false,
  isThinkingKnown = false,
  loadOlderMessages,
  messages = NO_MESSAGES,
  pendingMessage,
  ReplyActions: ReplyActionsProp,
  replyActions,
  ui,
  UserMessage = DefaultUserMessage,
}: ConversationViewProps) => {
  const themeScopeClassName = useAIThemeScopeClassName();
  const { t } = useTranslationContext();
  const { IconArrowDown, IconLoading } = useComponentContextIcons();

  const [tracker] = useState(() => new AIPendingMessageTracker());
  const [clock] = useState(() => new AIThinkingClock());

  // Every reply's UI reaches its renderer before any row asks for its view, oldest first,
  // whether or not the row is on screen. Only what arrived or changed is passed on. The rows
  // show again when the host says what one of them shows changed.
  useAIUIHostRefresh(ui);
  ui?.receive(messages);
  const canShowUI = useMemo(() => (ui ? ui.canShow.bind(ui) : undefined), [ui]);
  const entries = useMemo(
    () => tracker.entries(messages, pendingMessage, canShowUI),
    [canShowUI, messages, pendingMessage, tracker],
  );
  // after `entries`, which matched the copies
  const thinking = isThinkingKnown
    ? isThinking
    : isThinking || tracker.isAwaitingReply(messages, pendingMessage, canShowUI);
  // The rows that started a turn keep starting one, so a turn keeps its key as older messages
  // load above it.
  const turnStarts = useRef(new Set<string>());
  const turns = useMemo(() => turnsOf(entries, turnStarts.current), [entries]);
  const latest = turns[turns.length - 1];
  const latestHasReplies = (latest?.entries.length ?? 0) > 1;
  const latestHasFirstStep = firstStepOf(latest) !== undefined;
  // Before the views below read it in their effects and next renders: a turn's thinking starts
  // and ends once.
  useIsomorphicLayoutEffect(() => {
    clock.update(latest?.id, thinking, latestHasReplies, latestHasFirstStep);
  }, [clock, latest?.id, latestHasFirstStep, latestHasReplies, thinking]);

  const replyActionsRef = useRef(replyActions);
  replyActionsRef.current = replyActions;
  const DefaultReplyActions = useMemo(() => {
    const ConversationReplyActions = ({
      isLatestReply,
      message,
      text,
    }: AIConversationReplyActionsProps) => (
      <AIReplyActions
        {...replyActionsRef.current?.(message, { isLatestReply })}
        text={text}
      />
    );
    return ConversationReplyActions;
  }, []);
  const ReplyActions =
    ReplyActionsProp === undefined ? DefaultReplyActions : ReplyActionsProp;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const turnElements = useRef(new Map<string, HTMLDivElement>());
  const [height, setHeight] = useState(0);
  const [isEndInView, setIsEndInView] = useState(true);
  const lastTurnIdRef = useRef<string | undefined>(undefined);
  lastTurnIdRef.current = latest?.id;
  const bottomInsetRef = useRef(bottomInset);
  bottomInsetRef.current = bottomInset;

  // The end is where the latest turn's content ends, above the floating composer: not the
  // room the latest turn's minimum height leaves under a short reply.
  const checkEnd = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const turn =
      lastTurnIdRef.current === undefined
        ? undefined
        : turnElements.current.get(lastTurnIdRef.current);
    const last = turn?.lastElementChild as HTMLElement | null | undefined;
    const end = last
      ? last.offsetTop + last.offsetHeight
      : scroller.scrollHeight - bottomInsetRef.current;
    const visibleEnd =
      scroller.scrollTop + scroller.clientHeight - bottomInsetRef.current;
    setIsEndInView(end <= visibleEnd + END_SLACK);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    setHeight(scroller.clientHeight);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      setHeight(scroller.clientHeight);
      checkEnd();
    });
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [checkEnd]);

  // Content that grows without this component rendering, such as an answer typing out or an
  // image loading, moves the end too.
  const hasTurns = turns.length > 0;
  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => checkEnd());
    observer.observe(content);
    return () => observer.disconnect();
  }, [checkEnd, hasTurns]);

  // Where the turns in view were, the one at the top first, so older messages arriving above
  // them leave them in place.
  const held = useRef<HeldTurn[]>([]);
  const noteHeld = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const top = scroller.scrollTop;
    const bottom = top + scroller.clientHeight;
    held.current = [...turnElements.current]
      .map(([id, element]) => ({ element, id }))
      .filter(
        ({ element }) =>
          element.offsetTop + element.offsetHeight > top && element.offsetTop < bottom,
      )
      .sort((a, b) => a.element.offsetTop - b.element.offsetTop)
      .map(({ element, id }) => ({ id, top: element.offsetTop - top }));
  }, []);

  // Noting where the turns are reads the layout of each, so scrolling does it once a frame.
  const scrollFrame = useRef<number | undefined>(undefined);
  const onScroll = () => {
    if (scrollFrame.current !== undefined) return;
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = undefined;
      noteHeld();
      checkEnd();
    });
  };
  useEffect(() => () => cancelAnimationFrame(scrollFrame.current ?? 0), []);

  const scrollToEnd = useCallback((smooth: boolean) => {
    const scroller = scrollerRef.current;
    if (scroller) scrollScroller(scroller, scroller.scrollHeight, smooth);
  }, []);

  const firstTurnId = turns[0]?.id;
  const lastTurnId = latest?.id;
  const loadsOlder = !!loadOlderMessages && turns.length > 0;
  const shown = useRef<{
    firstTurnId?: string;
    height: number;
    lastTurnId?: string;
    loadsOlder: boolean;
    mounted: boolean;
  }>({ height: 0, loadsOlder, mounted: false });

  // Runs when the turns around what is in view change, not on every render: a reply streaming in
  // grows only the latest turn, which the observers above follow.
  useIsomorphicLayoutEffect(() => {
    const previous = shown.current;
    shown.current = { firstTurnId, height, lastTurnId, loadsOlder, mounted: true };
    const scroller = scrollerRef.current;
    if (!scroller) return;

    // Opens at its end, and again once its height is known, which sets the latest turn's
    // minimum height and so where the end is.
    if (!previous.mounted || (previous.height === 0 && height > 0)) {
      scroller.scrollTop = scroller.scrollHeight;
    } else if (
      previous.firstTurnId !== undefined &&
      (previous.firstTurnId !== firstTurnId || previous.loadsOlder !== loadsOlder) &&
      previous.lastTurnId === lastTurnId
    ) {
      // Older messages arrived above what is in view, or the spinner came or went: the turn at
      // the top goes back to where it was, rather than being pushed. The top one can be gone: a
      // turn that starts with a reply joins the turn of its question when older messages bring it.
      const anchor = held.current.find(({ id }) => turnElements.current.has(id));
      const element = anchor && turnElements.current.get(anchor.id);
      if (anchor && element) scroller.scrollTop = element.offsetTop - anchor.top;
    } else if (lastTurnId !== previous.lastTurnId && lastTurnId !== undefined) {
      // A new question pins to the top, once laid out at least as tall as the conversation. A
      // conversation replaced as a whole opens at its end.
      const continues =
        previous.lastTurnId !== undefined &&
        turnElements.current.has(previous.lastTurnId);
      const element = turnElements.current.get(lastTurnId);
      if (continues && element) scrollScroller(scroller, element.offsetTop, true);
      else scroller.scrollTop = scroller.scrollHeight;
    }
    noteHeld();
    checkEnd();
  }, [checkEnd, firstTurnId, height, lastTurnId, loadsOlder, noteHeld]);

  // Loads older messages once the spinner above the turns has been in view a moment, and again
  // whenever the first turn changes while it is in view.
  const loadOlderRef = useRef(loadOlderMessages);
  loadOlderRef.current = loadOlderMessages;
  const spinnerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const spinner = spinnerRef.current;
    const scroller = scrollerRef.current;
    if (
      !loadsOlder ||
      !spinner ||
      !scroller ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let loading = false;
    let disposed = false;
    const observer = new IntersectionObserver(
      ([visible]) => {
        clearTimeout(timer);
        if (!visible?.isIntersecting || loading) return;
        timer = setTimeout(() => {
          loading = true;
          let failed = false;
          Promise.resolve(loadOlderRef.current?.())
            .catch(() => {
              failed = true;
            })
            .finally(() => {
              loading = false;
              if (disposed) return;
              // Watching the spinner afresh reports whether it is still in view, so a load that
              // failed, or brought nothing while there is more, asks again: after a pause when
              // it failed. A load that brought older messages re-runs this effect instead.
              observer.unobserve(spinner);
              timer = setTimeout(
                () => observer.observe(spinner),
                failed ? LOAD_OLDER_RETRY_MS : 0,
              );
            });
        }, LOAD_OLDER_DELAY_MS);
      },
      { root: scroller },
    );
    observer.observe(spinner);
    return () => {
      disposed = true;
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [firstTurnId, loadsOlder]);

  const renderTurn = (turn: AIConversationTurn) => {
    const isLatest = turn.id === lastTurnId;
    return (
      <div
        className={clsx(
          'str-chat__ai-conversation__turn',
          isLatest && 'str-chat__ai-conversation__turn--latest',
        )}
        data-turn-id={turn.id}
        key={turn.id}
        ref={(element) => {
          if (element) turnElements.current.set(turn.id, element);
          else turnElements.current.delete(turn.id);
        }}
        style={
          isLatest && height
            ? { minHeight: Math.max(0, height - bottomInset) }
            : undefined
        }
      >
        <AIThinkingTurnContext.Provider
          value={{ clock, firstStepId: firstStepOf(turn), key: turn.id }}
        >
          {turn.entries.map((entry) => (
            <EntryView
              approver={approver}
              AssistantMessage={AssistantMessage}
              editAction={editAction}
              entry={entry}
              key={entry.id}
              ReplyActions={ReplyActions}
              ui={ui}
              UserMessage={UserMessage}
            />
          ))}
          {isLatest && thinking && <AIThinking />}
          {isLatest && footer}
        </AIThinkingTurnContext.Provider>
      </div>
    );
  };

  return (
    <ThemeScopeProvider>
      <AIToolApproverProvider approver={approver}>
        <div
          className={clsx(themeScopeClassName, 'str-chat__ai-conversation', className)}
        >
          <div
            className='str-chat__ai-conversation__scroller'
            onScroll={onScroll}
            ref={scrollerRef}
          >
            {turns.length === 0 ? (
              <div
                className='str-chat__ai-conversation__empty'
                ref={contentRef}
                style={{ paddingBottom: bottomInset }}
              >
                {emptyContent}
              </div>
            ) : (
              <div
                className='str-chat__ai-conversation__turns'
                ref={contentRef}
                style={{ paddingBottom: bottomInset }}
              >
                {loadsOlder && (
                  <div
                    aria-label={t(
                      'aiComponents.conversation.loadingOlderMessages.ariaLabel',
                      'Loading older messages',
                    )}
                    className='str-chat__ai-conversation__loading-older'
                    ref={spinnerRef}
                    role='progressbar'
                  >
                    <IconLoading />
                  </div>
                )}
                {turns.map(renderTurn)}
              </div>
            )}
          </div>
          {!isEndInView && turns.length > 0 && (
            <button
              aria-label={t(
                'aiComponents.conversation.scrollToLatest.ariaLabel',
                'Scroll to latest',
              )}
              className='str-chat__ai-conversation__scroll-to-latest'
              onClick={() => scrollToEnd(true)}
              style={{ bottom: bottomInset }}
              title={t(
                'aiComponents.conversation.scrollToLatest.ariaLabel',
                'Scroll to latest',
              )}
              type='button'
            >
              <IconArrowDown />
            </button>
          )}
        </div>
      </AIToolApproverProvider>
    </ThemeScopeProvider>
  );
};
