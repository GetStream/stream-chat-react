import React, { useMemo } from 'react';

import { CloseIcon } from './icons';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar as DefaultAvatar } from '../Avatar';
import { Poll } from '../Poll';

import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useTranslationContext } from '../../context/TranslationContext';

import { useStateStore } from '../../store';
import { useMessageComposer } from './hooks';
import { renderText as defaultRenderText } from '../Message/renderText';
import type { MessageComposerState, TranslationLanguages } from 'stream-chat';
import type { MessageContextValue } from '../../context';

const messageComposerStateStoreSelector = (state: MessageComposerState) => ({
  quotedMessage: state.quotedMessage,
});

export const QuotedMessagePreviewHeader = () => {
  const { t } = useTranslationContext('QuotedMessagePreview');
  const messageComposer = useMessageComposer();
  const { quotedMessage } = useStateStore(
    messageComposer.state,
    messageComposerStateStoreSelector,
  );

  if (!quotedMessage) return null;

  return (
    <div className='str-chat__quoted-message-preview-header'>
      <div className='str-chat__quoted-message-reply-to-message'>
        {t<string>('Reply to Message')}
      </div>
      <button
        aria-label={t('aria/Cancel Reply')}
        className='str-chat__quoted-message-remove'
        onClick={() => messageComposer.setQuotedMessage(null)}
      >
        <CloseIcon />
      </button>
    </div>
  );
};

export type QuotedMessagePreviewProps = {
  renderText?: MessageContextValue['renderText'];
};

export const QuotedMessagePreview = ({
  renderText = defaultRenderText,
}: QuotedMessagePreviewProps) => {
  const { client } = useChatContext();
  const { Attachment = DefaultAttachment, Avatar = DefaultAvatar } =
    useComponentContext('QuotedMessagePreview');
  const { userLanguage } = useTranslationContext('QuotedMessagePreview');
  const messageComposer = useMessageComposer();
  const { quotedMessage } = useStateStore(
    messageComposer.state,
    messageComposerStateStoreSelector,
  );

  const quotedMessageText = useMemo(
    () =>
      quotedMessage?.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
      quotedMessage?.text,
    [quotedMessage?.i18n, quotedMessage?.text, userLanguage],
  );

  const renderedText = useMemo(
    () => renderText(quotedMessageText, quotedMessage?.mentioned_users),
    [quotedMessage, quotedMessageText, renderText],
  );

  const quotedMessageAttachments = useMemo(
    () =>
      quotedMessage?.attachments?.length ? quotedMessage.attachments.slice(0, 1) : [],
    [quotedMessage],
  );

  const poll = quotedMessage?.poll_id && client.polls.fromState(quotedMessage.poll_id);

  if (!quotedMessageText && !quotedMessageAttachments.length && !poll) return null;

  return (
    <div
      className='str-chat__quoted-message-preview'
      data-testid='quoted-message-preview'
    >
      {quotedMessage?.user && (
        <Avatar
          className='str-chat__avatar--quoted-message-sender'
          image={quotedMessage.user.image}
          name={quotedMessage.user.name || quotedMessage.user.id}
          user={quotedMessage.user}
        />
      )}
      <div className='str-chat__quoted-message-bubble'>
        {poll ? (
          <Poll isQuoted poll={poll} />
        ) : (
          <>
            {!!quotedMessageAttachments.length && (
              <Attachment attachments={quotedMessageAttachments} isQuoted />
            )}
            <div
              className='str-chat__quoted-message-text'
              data-testid='quoted-message-text'
            >
              {renderedText}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
