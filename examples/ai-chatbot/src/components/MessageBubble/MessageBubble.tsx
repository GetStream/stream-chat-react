import { useMemo } from 'react';
import clsx from 'clsx';
import { StreamingMessage } from '@stream-io/chat-react-ai';
import {
  Attachment,
  messageHasAttachments,
  useMessageContext,
} from 'stream-chat-react';
import './MessageBubble.scss';

export const MessageBubble = () => {
  const { message, isMyMessage, highlighted, handleAction } =
    useMessageContext();

  const hasAttachment = messageHasAttachments(message);
  const finalAttachments = useMemo(
    () =>
      !message.shared_location && !message.attachments
        ? []
        : !message.shared_location
          ? message.attachments
          : [message.shared_location, ...(message.attachments ?? [])],
    [message],
  );

  const rootClassName = clsx(
    'ai-demo-message',
    `ai-demo-message--${message.type}`,
    `ai-demo-message--${message.status}`,
    {
      'ai-demo-message--user': isMyMessage(),
      'ai-demo-message--ai': !isMyMessage(),
      'ai-demo-message--has-text': !!message.text,
      'ai-demo-message--has-attachment': hasAttachment,
      'ai-demo-message--highlighted': highlighted,
      'ai-demo-message--can-retry':
        message?.status === 'failed' && message?.error?.status !== 403,
    },
  );

  return (
    <div className={rootClassName}>
      <div className="ai-demo-message__inner">
        <div className="ai-demo-message__bubble">
          {finalAttachments?.length ? (
            <Attachment
              actionHandler={handleAction}
              attachments={finalAttachments}
            />
          ) : null}

          <StreamingMessage text={message?.text || ''} />
        </div>
      </div>
    </div>
  );
};
