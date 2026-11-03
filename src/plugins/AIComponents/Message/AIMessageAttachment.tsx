import React from 'react';
import clsx from 'clsx';

import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';

/**
 * What a message carries besides its text, such as an image or a file. The counterpart of
 * `AIMessageAttachment` in StreamChatAI.
 */
export type AIMessageAttachmentData = {
  /** `image` shows a thumbnail; `file` shows its name, type and size. An open set. */
  kind: 'image' | 'file' | (string & {});
  /** Data of its own, such as what an attachment of a kind of your own needs. */
  extraData?: Record<string, unknown>;
  /** Its media type, such as `application/pdf`. Without it, the type comes from its name or URL. */
  mimeType?: string;
  /** Its name, such as the file's. */
  name?: string;
  /** Its size, in bytes. */
  size?: number;
  /** Where it is: a web URL, or an object or data URL of something the app holds, such as a photo just picked. */
  url?: string;
};

const extensionOf = (attachment: AIMessageAttachmentData) => {
  for (const candidate of [attachment.name, attachment.url]) {
    if (!candidate) continue;
    const path = candidate.split(/[?#]/)[0] ?? '';
    const file = path.split('/').pop() ?? '';
    const dot = file.lastIndexOf('.');
    if (dot > 0 && dot < file.length - 1) return file.slice(dot + 1);
  }
  return attachment.mimeType?.split('/')[1]?.split(/[+;]/)[0];
};

const formatSize = (bytes: number, locale: string) => {
  const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;
  let value = bytes;
  let index = 0;
  while (value >= 1000 && index < units.length - 1) {
    value /= 1000;
    index += 1;
  }
  try {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: index === 0 ? 0 : 1,
      style: 'unit',
      unit: units[index],
      unitDisplay: 'short',
    }).format(value);
  } catch {
    return `${value.toFixed(index === 0 ? 0 : 1)} ${['B', 'KB', 'MB', 'GB'][index]}`;
  }
};

/** Its type and size, such as "PDF · 2.4 MB". */
export const attachmentDetails = (attachment: AIMessageAttachmentData, locale = 'en') =>
  [
    extensionOf(attachment)?.toUpperCase(),
    attachment.size !== undefined ? formatSize(attachment.size, locale) : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

export type AIMessageAttachmentProps = {
  attachment: AIMessageAttachmentData;
  /** Who sent it, which sets the side it leans to. */
  role?: 'user' | 'assistant' | (string & {});
  className?: string;
};

/**
 * An image or a file on a message: an image as a thumbnail that opens it, a file with its
 * name, type and size. The counterpart of `AIMessageAttachmentView`.
 */
export const AIMessageAttachment = ({
  attachment,
  className,
  role = 'assistant',
}: AIMessageAttachmentProps) => {
  const { t, userLanguage } = useTranslationContext();
  const { IconFile } = useComponentContextIcons();
  const name =
    attachment.name ||
    (attachment.url && !attachment.url.startsWith('data:')
      ? attachment.url.split(/[?#]/)[0]?.split('/').pop()
      : undefined) ||
    (attachment.kind === 'image' ? t('Image') : t('File'));

  const classes = clsx(
    'str-chat__ai-message-attachment',
    `str-chat__ai-message-attachment--${attachment.kind}`,
    `str-chat__ai-message-attachment--${role}`,
    className,
  );

  if (attachment.kind === 'image' && attachment.url) {
    return (
      <a className={classes} href={attachment.url} rel='noreferrer' target='_blank'>
        <img
          alt={name}
          className='str-chat__ai-message-attachment__image'
          src={attachment.url}
        />
      </a>
    );
  }

  const details = attachmentDetails(attachment, userLanguage);
  const content = (
    <>
      <span className='str-chat__ai-message-attachment__file-icon'>
        <IconFile />
      </span>
      <span className='str-chat__ai-message-attachment__file-text'>
        <span className='str-chat__ai-message-attachment__file-name'>{name}</span>
        {details && (
          <span className='str-chat__ai-message-attachment__file-details'>{details}</span>
        )}
      </span>
    </>
  );

  return attachment.url ? (
    <a
      className={classes}
      download={attachment.name}
      href={attachment.url}
      rel='noreferrer'
      target='_blank'
    >
      {content}
    </a>
  ) : (
    <div className={classes}>{content}</div>
  );
};
