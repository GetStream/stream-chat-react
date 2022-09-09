import React, { useMemo } from 'react';
import { sanitizeUrl } from '@braintree/sanitize-url';
import type { ReactPlayerProps } from 'react-player';
import type { Attachment as StreamAttachment } from 'stream-chat';

import {
  GroupedRenderedAttachment,
  isAudioAttachment,
  isFileAttachment,
  isMediaAttachment,
  isScrapedContent,
  isUploadedImage,
} from './utils';

import {
  AudioContainer,
  CardContainer,
  FileContainer,
  GalleryContainer,
  ImageContainer,
  MediaContainer,
} from './AttachmentContainer';

import type { AttachmentActionsProps } from './AttachmentActions';
import type { AudioProps } from './Audio';
import type { CardProps } from './Card';
import type { FileAttachmentProps } from './FileAttachment';
import type { GalleryProps, ImageProps } from '../Gallery';
import type { ActionHandlerReturnType } from '../Message/hooks/useActionHandler';

import type { DefaultStreamChatGenerics } from '../../types/types';

const CONTAINER_MAP = {
  audio: AudioContainer,
  card: CardContainer,
  file: FileContainer,
  media: MediaContainer,
} as const;

export const ATTACHMENT_GROUPS_ORDER = [
  'card',
  'gallery',
  'image',
  'media',
  'audio',
  'file',
] as const;

export type AttachmentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** The message attachments to render, see [attachment structure](https://getstream.io/chat/docs/javascript/message_format/?language=javascript) **/
  attachments: StreamAttachment<StreamChatGenerics>[];
  /**	The handler function to call when an action is performed on an attachment, examples include canceling a \/giphy command or shuffling the results. */
  actionHandler?: ActionHandlerReturnType;
  /** Custom UI component for displaying attachment actions, defaults to and accepts same props as: [AttachmentActions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/AttachmentActions.tsx) */
  AttachmentActions?: React.ComponentType<AttachmentActionsProps<StreamChatGenerics>>;
  /** Custom UI component for displaying an audio type attachment, defaults to and accepts same props as: [Audio](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Audio.tsx) */
  Audio?: React.ComponentType<AudioProps<StreamChatGenerics>>;
  /** Custom UI component for displaying a card type attachment, defaults to and accepts same props as: [Card](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Card.tsx) */
  Card?: React.ComponentType<CardProps>;
  /** Custom UI component for displaying a file type attachment, defaults to and accepts same props as: [File](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/FileAttachment.tsx) */
  File?: React.ComponentType<FileAttachmentProps<StreamChatGenerics>>;
  /** Custom UI component for displaying a gallery of image type attachments, defaults to and accepts same props as: [Gallery](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Gallery.tsx) */
  Gallery?: React.ComponentType<GalleryProps<StreamChatGenerics>>;
  /** Custom UI component for displaying an image type attachment, defaults to and accepts same props as: [Image](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Image.tsx) */
  Image?: React.ComponentType<ImageProps>;
  /** Custom UI component for displaying a media type attachment, defaults to `ReactPlayer` from 'react-player' */
  Media?: React.ComponentType<ReactPlayerProps>;
};

/**
 * A component used for rendering message attachments. By default, the component supports: AttachmentActions, Audio, Card, File, Gallery, Image, and Video
 */
export const Attachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: AttachmentProps<StreamChatGenerics>,
) => {
  const { attachments } = props;

  const groupedAttachments = useMemo(() => renderGroupedAttachments(props), [attachments]);

  return (
    <div className='str-chat__attachment-list'>
      {ATTACHMENT_GROUPS_ORDER.reduce(
        (acc, groupName) => [...acc, ...groupedAttachments[groupName]],
        [] as React.ReactNode[],
      )}
    </div>
  );
};

const renderGroupedAttachments = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  attachments,
  ...rest
}: AttachmentProps<StreamChatGenerics>): GroupedRenderedAttachment => {
  const uploadedImages: StreamAttachment<StreamChatGenerics>[] = [];

  const containers = attachments.reduce<GroupedRenderedAttachment>(
    (acc, attachment) => {
      if (isUploadedImage(attachment)) {
        uploadedImages.push({
          ...attachment,
          image_url: sanitizeUrl(attachment.image_url),
          thumb_url: sanitizeUrl(attachment.thumb_url),
        });
      } else {
        const attachmentType = getAttachmentType(attachment);

        if (attachmentType) {
          const Container = CONTAINER_MAP[attachmentType];
          acc[attachmentType].push(
            <Container
              key={`${attachmentType}-${acc[attachmentType].length}`}
              {...rest}
              attachment={attachment}
            />,
          );
        }
      }
      return acc;
    },
    {
      audio: [],
      card: [],
      file: [],
      gallery: [],
      image: [],
      media: [],
    },
  );

  if (uploadedImages.length > 1) {
    containers['gallery'] = [
      <GalleryContainer
        key='gallery-container'
        {...rest}
        attachment={{
          images: uploadedImages,
          type: 'gallery',
        }}
      />,
    ];
  } else if (uploadedImages.length === 1) {
    containers['image'] = [
      <ImageContainer key='image-container' {...rest} attachment={uploadedImages[0]} />,
    ];
  }
  return containers;
};

const getAttachmentType = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: AttachmentProps<StreamChatGenerics>['attachments'][number],
): keyof typeof CONTAINER_MAP | null => {
  if (isScrapedContent(attachment)) {
    return 'card';
  } else if (isMediaAttachment(attachment)) {
    return 'media';
  } else if (isAudioAttachment(attachment)) {
    return 'audio';
  } else if (isFileAttachment(attachment)) {
    return 'file';
  }

  return null;
};
