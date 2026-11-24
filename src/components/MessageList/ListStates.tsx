import React from 'react';

import {
  ListLoadingNextPageUI as DefaultListLoadingNextPageUI,
  type ListEdge,
  type ListLoadingNextPageUIProps,
} from '../ListStates';
import { renderWithDeprecatedKey } from '../ListStates/utils';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading/LoadingIndicator';
import { useComponentContext } from '../../context/ComponentContext';
import { useComponentContextIcons } from '../../context/useComponentContextIcons';
import { useTranslationContext } from '../../context/TranslationContext';
import { asDynamicKey } from '../../i18n/utils';
import { useThreadContext } from '../Threads';
import type { CommonVirtuosoComponentProps } from './VirtualizedMessageListComponents';

// The message lists' list states: the empty state of a channel's list and the indicator at the edge
// where a further page loads. Each renders the shared `List…` key, or the message lists' own
// default; the deprecated `EmptyStateIndicator` key wins while set.

export type MessageListEmptyProps = {
  /** Replaces the default text. It goes through `t`, so it may be a translation key. */
  messageText?: string;
};

/**
 * The message lists' empty state, used while the app sets no `ListEmptyUI`: an icon and
 * "Send a message to start the conversation".
 */
export const MessageListEmpty = ({ messageText }: MessageListEmptyProps) => {
  const { t } = useTranslationContext();
  const { IconMessageBubble } = useComponentContextIcons();
  const text = messageText
    ? t(asDynamicKey(messageText))
    : t(
        'emptyState.indicator.startConversation.label',
        'Send a message to start the conversation',
      );
  return (
    <div className='str-chat__empty-channel'>
      <IconMessageBubble />
      <p className='str-chat__empty-channel-text' role='listitem'>
        {text}
      </p>
    </div>
  );
};

/** A channel's message list without messages: `ListEmptyUI`, or the message lists' own. */
export const MessageListEmptyUI = () => {
  const { EmptyStateIndicator, ListEmptyUI = MessageListEmpty } = useComponentContext();
  return renderWithDeprecatedKey(
    EmptyStateIndicator,
    { listType: 'message' },
    <ListEmptyUI />,
  );
};

/**
 * The page loading at an edge of `MessageList`: `ListLoadingNextPageUI`, centered above or
 * below the messages.
 */
export const MessageListLoadingNextPageUI = (props: ListLoadingNextPageUIProps) => {
  const { ListLoadingNextPageUI = DefaultListLoadingNextPageUI } = useComponentContext();
  return (
    <div className='str-chat__list__loading'>
      <ListLoadingNextPageUI {...props} />
    </div>
  );
};

/**
 * The page loading at an edge of `VirtualizedMessageList`: `ListLoadingNextPageUI`. Its
 * default renders nothing while `LoadingIndicator` is `null`, so the wrapper goes too.
 */
export const VirtualizedMessageListLoadingNextPageUI = ({
  position,
}: {
  position: ListEdge;
}) => {
  const { ListLoadingNextPageUI, LoadingIndicator } = useComponentContext();
  if (!ListLoadingNextPageUI && LoadingIndicator === null) return null;
  const Indicator = ListLoadingNextPageUI ?? DefaultListLoadingNextPageUI;

  return (
    <div className='str-chat__virtual-list__loading'>
      <Indicator isLoading position={position} />
    </div>
  );
};

/**
 * Shown over `VirtualizedMessageList` while react-virtuoso keeps the list hidden to position it
 * (opening the list, a jump): the `LoadingIndicator`, centered. A `LoadingIndicator` set to `null`
 * turns it off.
 */
export const VirtualizedMessageListPositioningUI = () => {
  // The default applies only to an unset key, so `null` stays `null` and hides the spinner.
  const { LoadingIndicator = DefaultLoadingIndicator } = useComponentContext();
  if (!LoadingIndicator) return null;
  return (
    <div className='str-chat__virtual-list__positioning'>
      <LoadingIndicator />
    </div>
  );
};

/**
 * Virtuoso's empty slot: the empty state of a channel's message list. A thread's list always shows
 * its parent message, so it is never an empty view.
 */
export const VirtualizedMessageListEmptyUI = ({
  context,
}: CommonVirtuosoComponentProps) => {
  const thread = useThreadContext();
  const { EmptyStateIndicator } = useComponentContext();

  if (!context) return null;
  const renderedMessageCount = context.processedMessages.length;
  // Only the deprecated key is rendered in threads, with its `listType` prop set to `thread`.
  if (thread) {
    return renderWithDeprecatedKey(
      EmptyStateIndicator,
      { listType: 'thread' },
      null,
      renderedMessageCount === 0,
    );
  }
  // Hidden messages (`hideDeletedMessages`) are not rendered, so they count as none.
  if (renderedMessageCount > 0) return null;

  return <MessageListEmptyUI />;
};
