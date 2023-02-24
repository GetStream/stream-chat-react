import React, { useMemo } from 'react';
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
  UnsupportedAttachmentContainer,
} from './AttachmentContainer';

import type { AttachmentActionsProps } from './AttachmentActions';
import type { AudioProps } from './Audio';
import type { CardProps } from './Card';
import type { FileAttachmentProps } from './FileAttachment';
import type { GalleryProps, ImageProps } from '../Gallery';
import type { UnsupportedAttachmentProps } from './UnsupportedAttachment';
import type { ActionHandlerReturnType } from '../Message/hooks/useActionHandler';

import type { DefaultStreamChatGenerics } from '../../types/types';

const CONTAINER_MAP = {
  audio: AudioContainer,
  card: CardContainer,
  file: FileContainer,
  media: MediaContainer,
  unsupported: UnsupportedAttachmentContainer,
} as const;

export const ATTACHMENT_GROUPS_ORDER = [
  'card',
  'gallery',
  'image',
  'media',
  'audio',
  'file',
  'unsupported',
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
  /** Custom UI component for displaying unsupported attachment types, defaults to NullComponent */
  UnsupportedAttachment?: React.ComponentType<UnsupportedAttachmentProps>;
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
  const uploadedImages: StreamAttachment<StreamChatGenerics>[] = attachments.filter((attachment) =>
    isUploadedImage(attachment),
  );

  const containers = attachments
    .filter((attachment) => !isUploadedImage(attachment))
    .reduce<GroupedRenderedAttachment>(
      (typeMap, attachment) => {
        const attachmentType = getAttachmentType(attachment);

        const Container = CONTAINER_MAP[attachmentType];
        typeMap[attachmentType].push(
          <Container
            key={`${attachmentType}-${typeMap[attachmentType].length}`}
            {...rest}
            attachment={attachment}
          />,
        );

        return typeMap;
      },
      {
        audio: [],
        card: [],
        file: [],
        media: [],
        unsupported: [],
        // not used in reduce
        // eslint-disable-next-line sort-keys
        image: [],
        // eslint-disable-next-line sort-keys
        gallery: [],
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
): keyof typeof CONTAINER_MAP => {
  if (isScrapedContent(attachment)) {
    return 'card';
  } else if (isMediaAttachment(attachment)) {
    return 'media';
  } else if (isAudioAttachment(attachment)) {
    return 'audio';
  } else if (isFileAttachment(attachment)) {
    return 'file';
  }

  return 'unsupported';
};
