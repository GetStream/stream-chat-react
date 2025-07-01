import React, { useEffect, useRef } from 'react';
import type { LocalMessage } from 'stream-chat';
import { formatMessage } from 'stream-chat';
import {
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';

export const MessageIsThreadReplyInChannelButtonIndicator = () => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { channel } = useChannelStateContext();
  const { openThread } = useChannelActionContext();
  const { message } = useMessageContext();
  const parentMessageRef = useRef<LocalMessage | null | undefined>(undefined);

  const querySearchParent = () =>
    channel
      .getClient()
      .search({ cid: channel.cid }, { id: message.parent_id })
      .then(({ results }) => {
        if (!results.length) {
          throw new Error('Thread has not been found');
        }
        parentMessageRef.current = formatMessage(results[0].message);
      })
      .catch((error: Error) => {
        client.notifications.addError({
          message: t('Thread has not been found'),
          options: {
            originalError: error,
            type: 'api:message:search:not-found',
          },
          origin: {
            context: { threadReply: message },
            emitter: 'MessageIsThreadReplyInChannelButtonIndicator',
          },
        });
      });

  useEffect(() => {
    if (
      parentMessageRef.current ||
      parentMessageRef.current === null ||
      !message.parent_id
    )
      return;
    const localMessage = channel.state.findMessage(message.parent_id);
    if (localMessage) {
      parentMessageRef.current = localMessage;
      return;
    }
  }, [channel, message]);

  if (!message.parent_id) return null;

  return (
    <div className='str-chat__message-is-thread-reply-button-wrapper'>
      <button
        className='str-chat__message-is-thread-reply-button'
        data-testid='message-is-thread-reply-button'
        onClick={async () => {
          if (!parentMessageRef.current) {
            // search query is performed here in order to prevent multiple search queries in useEffect
            // due to the message list 3x remounting its items
            await querySearchParent();
            if (parentMessageRef.current) {
              openThread(parentMessageRef.current);
            } else {
              // prevent further search queries if the message is not found in the DB
              parentMessageRef.current = null;
            }
            return;
          }
          openThread(parentMessageRef.current);
        }}
        type='button'
      >
        {t('Thread reply')}
      </button>
    </div>
  );
};
