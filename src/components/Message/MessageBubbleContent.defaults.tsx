/* eslint-disable sort-keys */
import React, { useMemo } from 'react';

import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useMessageContext } from '../../context/MessageContext';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Poll } from '../Poll';
import type { MessageBubbleContentSetItem } from './MessageBubbleContent';
import { MessageText } from './MessageText';
import { QuotedMessage as DefaultQuotedMessage } from './QuotedMessage';
import { StreamedMessageText as DefaultStreamedMessageText } from './StreamedMessageText';

const DefaultMessageBubbleContentComponents = {
  QuotedMessage() {
    const { QuotedMessage = DefaultQuotedMessage } = useComponentContext();
    return <QuotedMessage />;
  },
  Poll() {
    const { client } = useChatContext();
    const { message } = useMessageContext();
    const poll = message.poll_id && client.polls.fromState(message.poll_id);

    return poll ? <Poll poll={poll} /> : null;
  },
  Attachments() {
    const { Attachment = DefaultAttachment } = useComponentContext();
    const { handleAction, message } = useMessageContext();
    // A shared location renders as the first attachment.
    const attachments = useMemo(
      () =>
        message.shared_location
          ? [message.shared_location, ...(message.attachments ?? [])]
          : (message.attachments ?? []),
      [message.attachments, message.shared_location],
    );

    return <Attachment actionHandler={handleAction} attachments={attachments} />;
  },
  Text() {
    const { StreamedMessageText = DefaultStreamedMessageText } = useComponentContext();
    const { isMessageAIGenerated, message, renderText } = useMessageContext();

    return isMessageAIGenerated?.(message) ? (
      <StreamedMessageText message={message} renderText={renderText} />
    ) : (
      <MessageText message={message} renderText={renderText} />
    );
  },
};

/**
 * What `MessageBubbleContent` renders by default, in render order. Filter, reorder or extend it
 * and pass the result as `messageBubbleContentSet`.
 */
export const defaultMessageBubbleContentSet: MessageBubbleContentSetItem[] = [
  {
    Component: DefaultMessageBubbleContentComponents.QuotedMessage,
    isVisible: ({ message }) => !!message.quoted_message,
    type: 'quotedMessage',
  },
  {
    Component: DefaultMessageBubbleContentComponents.Poll,
    isVisible: ({ message }) => !!message.poll_id,
    type: 'poll',
  },
  {
    Component: DefaultMessageBubbleContentComponents.Attachments,
    isVisible: ({ message }) =>
      !!message.shared_location || !!message.attachments?.length,
    type: 'attachments',
  },
  {
    Component: DefaultMessageBubbleContentComponents.Text,
    // Streamed text renders while the AI response is still empty.
    isVisible: ({ isAIGenerated, message }) => isAIGenerated || !!message.text,
    type: 'text',
  },
];
