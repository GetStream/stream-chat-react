import React from 'react';
import clsx from 'clsx';
import { sanitizeUrl } from '@braintree/sanitize-url';

import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import { prettifyFileSize } from '../../../components/MessageComposer/hooks/utils';
import { useAIThemeScopeClassName } from '../themeScope';

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

// A web or blob URL as it is, and an image's data URL for its thumbnail (a photo just picked);
// anything else, such as `javascript:`, is blanked as the rest of the SDK's links are.
const safeUrl = (url: string, kind: AIMessageAttachmentData['kind']) =>
  /^blob:/i.test(url) || (kind === 'image' && /^data:image\//i.test(url))
    ? url
    : sanitizeUrl(url);

const BLANK_URL = 'about:blank';

/** Its type and size, such as "PDF · 2.34 MB". */
export const attachmentDetails = (attachment: AIMessageAttachmentData) =>
  [
    extensionOf(attachment)?.toUpperCase(),
    attachment.size !== undefined ? prettifyFileSize(attachment.size) : undefined,
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
  const themeScopeClassName = useAIThemeScopeClassName();
  const { t } = useTranslationContext();
  const { IconFile } = useComponentContextIcons();
  const url = attachment.url ? safeUrl(attachment.url, attachment.kind) : undefined;
  const name =
    attachment.name ||
    (attachment.url && !attachment.url.startsWith('data:')
      ? attachment.url.split(/[?#]/)[0]?.split('/').pop()
      : undefined) ||
    (attachment.kind === 'image'
      ? t('aiComponents.messageAttachment.image.text', 'Image')
      : t('aiComponents.messageAttachment.file.text', 'File'));

  const classes = clsx(
    themeScopeClassName,
    'str-chat__ai-message-attachment',
    `str-chat__ai-message-attachment--${attachment.kind}`,
    `str-chat__ai-message-attachment--${role}`,
    className,
  );

  if (attachment.kind === 'image' && url && url !== BLANK_URL) {
    return (
      <a className={classes} href={url} rel='noreferrer' target='_blank'>
        <img alt={name} className='str-chat__ai-message-attachment__image' src={url} />
      </a>
    );
  }

  const details = attachmentDetails(attachment);
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

  return url && url !== BLANK_URL ? (
    <a
      className={classes}
      download={attachment.name}
      href={url}
      rel='noreferrer'
      target='_blank'
    >
      {content}
    </a>
  ) : (
    <div className={classes}>{content}</div>
  );
};
