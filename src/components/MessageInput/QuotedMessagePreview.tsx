import React, {
  type ComponentType,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
  useMemo,
} from 'react';

import { displayDuration, SUPPORTED_VIDEO_FORMATS } from '../Attachment';

import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';

import { useStateStore } from '../../store';
import { useMessageComposer } from './hooks';
import {
  type Attachment,
  isAudioAttachment,
  isFileAttachment,
  isImageAttachment,
  isScrapedContent,
  isVideoAttachment,
  isVoiceRecordingAttachment,
  type LocalMessage,
  type LocalMessageBase,
  type MessageComposerState,
  type PollResponse,
  type SharedLocationResponse,
  type TranslationLanguages,
} from 'stream-chat';
import type { MessageContextValue } from '../../context';
import { RemoveAttachmentPreviewButton } from './RemoveAttachmentPreviewButton';
import {
  IconChainLink,
  IconChart5,
  IconFileBend,
  IconMapPin,
  IconMicrophone,
  IconPlaySolid,
  IconVideo,
  IconVideoSolid,
} from '../Icons';
import clsx from 'clsx';
import { BaseImage } from '../Gallery';
import { FileIcon } from '../FileIcon';
import { QuotedMessageIndicator } from './QuotedMessageIndicator';

const messageComposerStateStoreSelector = (state: MessageComposerState) => ({
  quotedMessage: state.quotedMessage,
});

export type QuotedMessagePreviewProps = {
  getQuotedMessageAuthor?: (message: LocalMessage) => string;
  renderText?: MessageContextValue['renderText'];
};

const NullAttachmentIcon = () => null;

type AttachmentType = 'documents' | 'images' | 'links' | 'videos' | 'voiceRecordings';

const getAttachmentType = (attachment: Attachment) => {
  if (isScrapedContent(attachment)) {
    return 'link';
  } else if (isVideoAttachment(attachment, SUPPORTED_VIDEO_FORMATS)) {
    return 'video';
  } else if (isImageAttachment(attachment)) {
    return 'image';
  } else if (isAudioAttachment(attachment)) {
    return 'audio';
  } else if (isVoiceRecordingAttachment(attachment)) {
    return 'voiceRecording';
  } else if (isFileAttachment(attachment, SUPPORTED_VIDEO_FORMATS)) {
    return 'file';
  }

  return 'unsupported';
};

type GroupedAttachments = Record<AttachmentType, Attachment[]> & {
  locations: SharedLocationResponse[];
  polls: PollResponse[];
  total: number;
};

const getGroupedAttachments = (quotedMessage: LocalMessage | null) => {
  const groupedAttachments = {
    documents: [],
    images: [],
    links: [],
    locations: [],
    polls: [],
    total: 0,
    videos: [],
    voiceRecordings: [],
  };

  if (!quotedMessage || !quotedMessage.attachments) return groupedAttachments;

  const result = quotedMessage.attachments.reduce<GroupedAttachments>(
    (count, attachment) => {
      switch (getAttachmentType(attachment)) {
        case 'link':
          count.links.push(attachment);
          count.total += 1;
          break;
        case 'video':
          count.videos.push(attachment);
          count.total += 1;
          break;
        case 'voiceRecording':
          count.voiceRecordings.push(attachment);
          count.total += 1;
          break;
        case 'audio':
        case 'file':
          count.documents.push(attachment);
          count.total += 1;
          break;
        default:
          if (isImageAttachment(attachment)) {
            count.images.push(attachment);
            count.total += 1;
          }
      }

      return count;
    },
    groupedAttachments,
  );
  if (quotedMessage.shared_location) {
    result.locations.push(quotedMessage.shared_location);
    result.total += 1;
  } else if (quotedMessage.poll) {
    result.polls.push(quotedMessage.poll);
    result.total += 1;
  }

  return result;
};

type PreviewType =
  | 'voice'
  | 'file'
  | 'image'
  | 'link'
  | 'location'
  | 'poll'
  | 'video'
  | 'mixed';

const getAttachmentIconWithType = (
  quotedMessage: LocalMessage | null,
): {
  groupedAttachments: GroupedAttachments;
  Icon: ComponentType;
  PreviewImage: ReactElement | null;
  previewType: PreviewType | null;
} => {
  const groupedAttachments = getGroupedAttachments(quotedMessage);
  const result = {
    groupedAttachments,
    Icon: NullAttachmentIcon,
    PreviewImage: null,
    previewType: null,
  };
  if (!groupedAttachments.total) return result;
  if (groupedAttachments.polls.length > 0)
    return { ...result, Icon: IconChart5, previewType: 'poll' };
  if (groupedAttachments.locations.length > 0)
    // todo: we do not generate the location preview image
    return { ...result, Icon: IconMapPin, previewType: 'location' };
  if (
    groupedAttachments.documents.length === groupedAttachments.total &&
    groupedAttachments.documents.length === 1
  ) {
    const fileAttachment = groupedAttachments.documents[0] as Attachment;
    return {
      ...result,
      Icon: IconFileBend,
      PreviewImage: (
        <FileIcon fileName={fileAttachment.title} mimeType={fileAttachment.mime_type} />
      ),
      previewType: 'file',
    };
  }
  if (groupedAttachments.links.length === groupedAttachments.total) {
    const linkAttachment = groupedAttachments.links[0];
    return {
      ...result,
      Icon: IconChainLink,
      PreviewImage: (
        <BaseImage
          alt={linkAttachment.title}
          className='str-chat__attachment-preview__thumbnail'
          src={linkAttachment.thumb_url || linkAttachment.image_url}
          title={linkAttachment.title}
        />
      ),
      previewType: 'link',
    };
  }
  if (groupedAttachments.videos.length === groupedAttachments.total) {
    const videoAttachment = groupedAttachments.videos[0];
    return {
      ...result,
      Icon: IconVideo,
      PreviewImage: (
        <>
          <BaseImage
            alt={videoAttachment.asset_url}
            className='str-chat__attachment-preview__thumbnail'
            src={videoAttachment.thumb_url}
            title={videoAttachment.title}
          />
          <div className='str-chat__attachment-preview__thumbnail__play-indicator'>
            <IconPlaySolid />
          </div>
        </>
      ),
      previewType: 'video',
    };
  }
  if (groupedAttachments.images.length === groupedAttachments.total) {
    const imageAttachment = groupedAttachments.images[0];
    return {
      ...result,
      Icon: IconVideoSolid,
      PreviewImage: (
        <BaseImage
          alt={imageAttachment.fallback}
          className='str-chat__attachment-preview__thumbnail'
          src={imageAttachment.image_url}
          title={imageAttachment.title}
        />
      ),
      previewType: 'image',
    };
  }
  if (groupedAttachments.voiceRecordings.length === groupedAttachments.total)
    return { ...result, Icon: IconMicrophone, previewType: 'voice' };

  return { ...result, Icon: IconFileBend, previewType: 'mixed' };
};

export const QuotedMessagePreview = ({
  getQuotedMessageAuthor,
  renderText,
}: QuotedMessagePreviewProps) => {
  const messageComposer = useMessageComposer();
  const { quotedMessage } = useStateStore(
    messageComposer.state,
    messageComposerStateStoreSelector,
  );

  return quotedMessage ? (
    <div className='str-chat__message-composer__quoted-message-preview-slot'>
      <QuotedMessagePreviewUI
        getQuotedMessageAuthor={getQuotedMessageAuthor}
        onRemove={() => messageComposer.setQuotedMessage(null)}
        quotedMessage={quotedMessage}
        renderText={renderText}
      />
    </div>
  ) : null;
};

type QuotedMessagePreviewUIProps = QuotedMessagePreviewProps & {
  quotedMessage: LocalMessageBase;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onRemove?: () => void;
};

export const QuotedMessagePreviewUI = ({
  getQuotedMessageAuthor,
  onClick,
  onRemove,
  quotedMessage,
  renderText,
}: QuotedMessagePreviewUIProps) => {
  const { client } = useChatContext();
  const { t, userLanguage } = useTranslationContext();

  const quotedMessageText = useMemo(
    () =>
      quotedMessage?.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
      quotedMessage?.text,
    [quotedMessage?.i18n, quotedMessage?.text, userLanguage],
  );

  const { AttachmentIcon, PreviewImage, renderedText } = useMemo(() => {
    if (!quotedMessage) return { AttachmentIcon: NullAttachmentIcon, renderedText: null };

    const {
      groupedAttachments,
      Icon: AttachmentIcon,
      PreviewImage,
      previewType,
    } = getAttachmentIconWithType(quotedMessage);

    let renderedText: ReactNode | undefined;

    if (!quotedMessageText) {
      if (previewType === 'poll') {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        renderedText = quotedMessage.poll!.name;
      } else if (previewType === 'location') {
        renderedText = t('Live location');
      } else if (previewType === 'voice') {
        {
          const voiceRecording = groupedAttachments.voiceRecordings[0];
          renderedText = t('Voice message {{ duration }}', {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            duration: displayDuration(voiceRecording!.duration),
          });
        }
      } else if (previewType === 'link') {
        renderedText = groupedAttachments.links[0].title;
      } else if (previewType === 'mixed') {
        renderedText = t('{{ count }} files', { count: groupedAttachments.total });
      } else if (previewType === 'video') {
        renderedText =
          groupedAttachments.videos.length === 1
            ? t('Video')
            : t('{{ count }} videos', {
                count: groupedAttachments.videos.length,
              });
      } else if (previewType === 'file') {
        renderedText = groupedAttachments.documents[0].title;
      } else if (previewType === 'image') {
        renderedText =
          groupedAttachments.images.length === 1
            ? t('Photo')
            : t('{{ count }} photos', {
                count: groupedAttachments.images.length,
              });
      }
    } else if (renderText) {
      renderedText = renderText(quotedMessageText, quotedMessage?.mentioned_users);
    } else {
      renderedText = quotedMessageText;
    }

    return {
      AttachmentIcon,
      PreviewImage,
      renderedText,
    };
  }, [quotedMessage, quotedMessageText, renderText, t]);

  const isOwnMessage = client.user?.id === quotedMessage?.user?.id;

  if (!renderedText && !AttachmentIcon && !PreviewImage) return null;

  const authorName = getQuotedMessageAuthor?.(quotedMessage) ?? quotedMessage.user?.name;
  return (
    <div
      className={clsx('str-chat__quoted-message-preview', {
        'str-chat__quoted-message-preview--own': isOwnMessage,
      })}
      data-testid='quoted-message-preview'
      onClick={onClick}
      tabIndex={onClick && 0}
    >
      <QuotedMessageIndicator isOwnMessage={isOwnMessage} />
      <div className='str-chat__quoted-message-preview__content'>
        <div className='str-chat__quoted-message-preview__author'>
          {isOwnMessage
            ? t('You')
            : authorName
              ? t('Reply to {{ authorName }}', { authorName })
              : t('Reply')}
        </div>

        <div
          className='str-chat__quoted-message-preview__message'
          data-testid='quoted-message-text'
        >
          <AttachmentIcon />
          <div className='str-chat__quoted-message-preview__message-text'>
            {renderedText}
          </div>
        </div>
      </div>
      {PreviewImage && (
        <div className='str-chat__quoted-message-preview__image'>{PreviewImage}</div>
      )}

      {onRemove && (
        <RemoveAttachmentPreviewButton
          aria-label={t('aria/Cancel Reply')}
          data-testid='quoted-message-preview-dismiss-btn'
          onClick={onRemove}
        />
      )}
    </div>
  );
};
