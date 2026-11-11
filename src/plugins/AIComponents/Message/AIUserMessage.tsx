import React from 'react';
import clsx from 'clsx';

import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import { AIMessageAttachment, type AIMessageAttachmentData } from './AIMessageAttachment';

export type AIUserMessageProps = {
  /** What the person wrote. */
  text: string;
  /** What they sent with it, such as images and files. */
  attachments?: AIMessageAttachmentData[];
  className?: string;
  /** Edits the message, such as by putting its text back in the composer. Without it, no edit button. */
  onEdit?: () => void;
};

/**
 * The person's message: its attachments, then its text in a bubble on the trailing side. The
 * counterpart of `AIUserMessageView`.
 */
export const AIUserMessage = ({
  attachments = [],
  className,
  onEdit,
  text,
}: AIUserMessageProps) => {
  const { t } = useTranslationContext();
  const { IconEdit } = useComponentContextIcons();
  return (
    <div className={clsx('str-chat__ai-user-message', className)}>
      {attachments.length > 0 && (
        <div className='str-chat__ai-user-message__attachments'>
          {attachments.map((attachment, index) => (
            <AIMessageAttachment attachment={attachment} key={index} role='user' />
          ))}
        </div>
      )}
      {text !== '' && (
        <div className='str-chat__ai-user-message__row'>
          {onEdit && (
            <button
              aria-label={t('aria/Edit')}
              className='str-chat__ai-reply-actions__button str-chat__ai-user-message__edit'
              onClick={onEdit}
              title={t('aria/Edit')}
              type='button'
            >
              <IconEdit />
            </button>
          )}
          <div className='str-chat__ai-user-message__bubble'>{text}</div>
        </div>
      )}
    </div>
  );
};
