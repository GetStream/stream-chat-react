import React, { useMemo } from 'react';
import type { LocalMessage } from 'stream-chat';

import { useMessageContext } from '../../context/MessageContext';
import { defaultMessageBubbleContentSet } from './MessageBubbleContent.defaults';

/**
 * The content types {@link defaultMessageBubbleContentSet} ships, listed for autocomplete. Any
 * string is accepted, so custom content names itself.
 */
export type DefaultMessageBubbleContentType =
  | 'attachments'
  | 'poll'
  | 'quotedMessage'
  | 'text';

/** What decides which parts of a message bubble show. */
export type MessageBubbleContentState = {
  /** Whether `isMessageAIGenerated` marks the message as AI generated (streamed text). */
  isAIGenerated: boolean;
  message: LocalMessage;
};

export type MessageBubbleContentSetItem = {
  /** Rendered without props while `isVisible` holds. Read the message with `useMessageContext()`. */
  Component: React.ComponentType;
  /** Whether the content shows for the message. */
  isVisible: (state: MessageBubbleContentState) => boolean;
  /** Names the content; unique within a set. */
  type: DefaultMessageBubbleContentType | (string & {});
};

export type MessageBubbleContentProps = {
  /** Content in render order. Defaults to {@link defaultMessageBubbleContentSet}. */
  messageBubbleContentSet?: MessageBubbleContentSetItem[];
};

/**
 * Renders what a message bubble holds (quoted message, poll, attachments, text) in the order of
 * `messageBubbleContentSet`, skipping what the message does not have.
 */
export const MessageBubbleContent = ({
  messageBubbleContentSet = defaultMessageBubbleContentSet,
}: MessageBubbleContentProps) => {
  const { isMessageAIGenerated, message } = useMessageContext();
  const isAIGenerated = !!isMessageAIGenerated?.(message);

  const visibleContentSet = useMemo(
    () =>
      messageBubbleContentSet.filter((item) =>
        item.isVisible({ isAIGenerated, message }),
      ),
    [isAIGenerated, message, messageBubbleContentSet],
  );

  return (
    <>
      {visibleContentSet.map(({ Component, type }) => (
        <Component key={type} />
      ))}
    </>
  );
};
