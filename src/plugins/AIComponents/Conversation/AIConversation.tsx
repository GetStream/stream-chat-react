import React, {
  type ComponentType,
  type ReactNode,
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
import type { AIBranchSwitch } from '../Message/AIBranchSwitcher';
import type { AIMessageAttachmentData } from '../Message/AIMessageAttachment';
import { AIReplyActions, type AIReplyActionsProps } from '../Message/AIReplyActions';
import { AIUserMessage } from '../Message/AIUserMessage';
import type { AIMessagePartData } from '../MessageParts/types';
import { AIThinking } from '../Reasoning/AIReasoning';
import { AIThinkingClock, AIThinkingTurnContext } from '../Reasoning/thinkingClock';
import { type AIToolApprover, AIToolApproverProvider } from '../ToolCalls/AIToolApprover';
import { useIsomorphicLayoutEffect } from '../utils';
import { useOlderPageLoader } from './hooks/useOlderPageLoader';
import { useTurnScroller } from './hooks/useTurnScroller';
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
import {
  editActionOf,
  latestUserMessageIdOf,
  replyActionsOf,
  userMessageActionsOf,
} from './controller/offers';
import { useAIConversationState } from './controller/useAIConversationState';
import type { AIUserMessageActions } from './controller/types';

export type { AIUserMessageActions };

export type AIConversationUserMessageProps = {
  /** What the person sent with it, such as images and files. */
  attachments: AIMessageAttachmentData[];
  /** What the person wrote. */
  text: string;
  /** The message, or `undefined` for one on its way. */
  message?: AIMessage;
  /**
   * Which of the question's versions shows, when the person edited it, from
   * `userMessageActions`, or from a `conversation` whose transport switches versions.
   * `AIUserMessage` shows a ‹ i/n › switcher while `count` is 2 or more.
   */
  branch?: AIBranchSwitch;
  /**
   * Edits the message in the composer: a `conversation` offers it on the person's latest
   * message, or on any of theirs when its transport switches versions.
   */
  onEdit?: () => void;
  /**
   * Saves the person's edit of the message, made in place, from `userMessageActions`, or from a
   * `conversation` whose transport switches versions. `AIUserMessage` uses it in place of
   * `onEdit` when both are passed.
   */
  onSaveEdit?: (text: string) => void;
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
   * replies and editing the person's latest message, or any reply and message of theirs, with a
   * ‹ i/n › switcher between versions, when its transport has `switchBranch`. It takes the place
   * of `messages`, `pendingMessage`, `isThinking` and `loadOlderMessages`, its reply and
   * user-message actions are used unless `replyActions` or `userMessageActions` is passed, and
   * its `approver` unless one is passed.
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
   * rating, how to rate or regenerate it, and which of its versions shows (`branch`).
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
  /**
   * What the person's messages offer besides what a `conversation` does: editing in place
   * (`onSaveEdit(text)`) and a ‹ i/n › switcher between the versions of an edited question
   * (`branch`). Passed to `UserMessage` as `onSaveEdit` and `branch`. Takes the place of a
   * `conversation`'s own, which, when its transport switches versions, offer the switcher and
   * editing in place.
   */
  userMessageActions?: (message: AIMessage) => AIUserMessageActions | undefined;
  /** The view of the person's messages. Defaults to `AIUserMessage`. */
  UserMessage?: ComponentType<AIConversationUserMessageProps>;
};

const DefaultUserMessage = ({
  attachments,
  branch,
  onEdit,
  onSaveEdit,
  text,
}: AIConversationUserMessageProps) => (
  <AIUserMessage
    attachments={attachments}
    branch={branch}
    onEdit={onEdit}
    onSaveEdit={onSaveEdit}
    text={text}
  />
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
  userMessageActions?: AIConversationProps['userMessageActions'];
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
  userMessageActions,
}: EntryViewProps) => {
  const { message, pending } = entry;
  if (!message) {
    return pending ? (
      <UserMessage attachments={pending.attachments ?? []} text={pending.text} />
    ) : null;
  }
  if (message.role === 'user') {
    const actions = userMessageActions?.(message);
    return (
      <UserMessage
        attachments={
          entry.sentAttachments.length
            ? entry.sentAttachments
            : (message.attachments ?? [])
        }
        branch={actions?.branch}
        message={message}
        onEdit={editAction?.(message)}
        onSaveEdit={actions?.onSaveEdit}
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

// The turn's first reasoning step, which takes over the seconds the turn was seen thinking.
const firstStepOf = (turn: AIConversationTurn | undefined) => {
  for (const { message } of turn?.entries ?? []) {
    if (!message || message.role === 'user') continue;
    const step = message.parts?.find((part) => part.reasoning);
    if (step) return step.id;
  }
  return undefined;
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
  isSwitchingBranch,
  messages,
  pendingMessage,
  ratings,
  status,
}: AIConversationControllerState) => ({
  hasOlderMessages,
  isSwitchingBranch,
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
  const {
    hasOlderMessages,
    isSwitchingBranch,
    messages,
    pendingMessage,
    ratings,
    status,
  } = useAIConversationState(conversation, controlledSelector);
  const replyActions = useMemo(
    () =>
      (message: AIMessage, { isLatestReply }: { isLatestReply: boolean }) =>
        replyActionsOf(
          conversation,
          { isSwitchingBranch, ratings, status },
          message,
          isLatestReply,
        ),
    [conversation, isSwitchingBranch, ratings, status],
  );
  const latestUserMessageId = latestUserMessageIdOf(messages);
  const editAction = useMemo<EditAction>(
    () => (message) =>
      editActionOf(
        conversation,
        { isSwitchingBranch, latestUserMessageId, status },
        message,
      ),
    [conversation, isSwitchingBranch, latestUserMessageId, status],
  );
  // The switcher between the versions of a question the person edited, and editing in place,
  // while the transport switches versions.
  const userMessageActions = useMemo(
    () =>
      conversation.canSwitchBranch
        ? (message: AIMessage) =>
            userMessageActionsOf(
              conversation,
              { isSwitchingBranch, latestUserMessageId, status },
              message,
            )
        : undefined,
    [conversation, isSwitchingBranch, latestUserMessageId, status],
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
      userMessageActions={props.userMessageActions ?? userMessageActions}
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
  userMessageActions,
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

  const firstTurnId = turns[0]?.id;
  const lastTurnId = latest?.id;
  const loadsOlder = !!loadOlderMessages && turns.length > 0;

  const {
    contentRef,
    height,
    isEndInView,
    onScroll,
    scrollerRef,
    scrollToEnd,
    turnElements,
  } = useTurnScroller({
    bottomInset,
    firstTurnId,
    hasTurns: turns.length > 0,
    lastTurnId,
    loadsOlder,
  });
  const spinnerRef = useOlderPageLoader({
    firstTurnId,
    loadOlderMessages,
    loadsOlder,
    scrollerRef,
  });

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
              userMessageActions={userMessageActions}
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
