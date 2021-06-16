import React from 'react';
import ReactPlayer, { ReactPlayerProps } from 'react-player';

import {
  AttachmentActionsProps,
  AttachmentActions as DefaultAttachmentActions,
} from './AttachmentActions';
import { AudioProps, Audio as DefaultAudio } from './Audio';
import { CardProps, Card as DefaultCard } from './Card';
import { FileAttachment as DefaultFile, FileAttachmentProps } from './FileAttachment';
import {
  isAudioAttachment,
  isFileAttachment,
  isGalleryAttachment,
  isImageAttachment,
  isMediaAttachment,
  renderAudio,
  renderCard,
  renderFile,
  renderGallery,
  renderImage,
  renderMedia,
} from './utils';

import {
  Gallery as DefaultGallery,
  ImageComponent as DefaultImage,
  GalleryProps,
  ImageProps,
} from '../Gallery';

import type { Attachment as StreamAttachment } from 'stream-chat';

import type { ActionHandlerReturnType } from '../Message';

import type { DefaultAttachmentType } from '../../types/types';

export type AttachmentProps<At extends DefaultAttachmentType = DefaultAttachmentType> = {
  /** The message attachments to render, see [attachment structure](https://getstream.io/chat/docs/javascript/message_format/?language=javascript) **/
  attachments: ExtendedAttachment<At>[];
  /**	The handler function to call when an action is performed on an attachment, examples include canceling a \/giphy command or shuffling the results. */
  actionHandler?: ActionHandlerReturnType;
  /** Custom UI component for displaying attachment actions, defaults to and accepts same props as: [AttachmentActions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/AttachmentActions.tsx) */
  AttachmentActions?: React.ComponentType<AttachmentActionsProps>;
  /** Custom UI component for displaying an audio type attachment, defaults to and accepts same props as: [Audio](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Audio.tsx) */
  Audio?: React.ComponentType<AudioProps>;
  /** Custom UI component for displaying a card type attachment, defaults to and accepts same props as: [Card](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Card.tsx) */
  Card?: React.ComponentType<CardProps>;
  /** Custom UI component for displaying a file type attachment, defaults to and accepts same props as: [File](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/FileAttachment.tsx) */
  File?: React.ComponentType<FileAttachmentProps>;
  /** Custom UI component for displaying a gallery of image type attachments, defaults to and accepts same props as: [Gallery](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Gallery.tsx) */
  Gallery?: React.ComponentType<GalleryProps>;
  /** Custom UI component for displaying an image type attachment, defaults to and accepts same props as: [Image](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Image.tsx) */
  Image?: React.ComponentType<ImageProps>;
  /** Custom UI component for displaying a media type attachment, defaults to `ReactPlayer` from 'react-player' */
  Media?: React.ComponentType<ReactPlayerProps>;
};

export type DefaultAttachmentProps<
  At extends DefaultAttachmentType = DefaultAttachmentType
> = Required<
  Pick<
    InnerAttachmentUIComponentProps,
    'AttachmentActions' | 'Audio' | 'Card' | 'File' | 'Gallery' | 'Image' | 'Media'
  >
> & {
  attachment: ExtendedAttachment<At>;
  componentType: string;
};

export type ExtendedAttachment<
  At extends DefaultAttachmentType = DefaultAttachmentType
> = StreamAttachment<At> & {
  asset_url?: string;
  id?: string;
  images?: Array<{
    image_url?: string;
    thumb_url?: string;
  }>;
  mime_type?: string;
};

export type InnerAttachmentUIComponentProps<
  At extends DefaultAttachmentType = DefaultAttachmentType
> = Omit<AttachmentProps<At>, 'attachments'> & {
  attachment: ExtendedAttachment<At>;
};

/**
 * A component used for rendering message attachments. By default, the component supports: AttachmentActions, Audio, Card, File, Gallery, Image, and Video
 */
export const Attachment = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  props: AttachmentProps<At>,
) => {
  const {
    AttachmentActions = DefaultAttachmentActions,
    attachments,
    Audio = DefaultAudio,
    Card = DefaultCard,
    File = DefaultFile,
    Gallery = DefaultGallery,
    Image = DefaultImage,
    Media = ReactPlayer,
    ...rest
  } = props;

  const gallery = {
    images: attachments?.filter(
      (attachment) =>
        attachment.type === 'image' && !(attachment.og_scrape_url || attachment.title_link),
    ),
    type: 'gallery',
  };

  let newAttachments;

  if (gallery.images?.length >= 2) {
    newAttachments = [
      ...attachments.filter(
        (attachment) =>
          !(attachment.type === 'image' && !(attachment.og_scrape_url || attachment.title_link)),
      ),
      gallery,
    ];
  } else {
    newAttachments = attachments;
  }

  const propsWithDefault = {
    AttachmentActions,
    Audio,
    Card,
    File,
    Gallery,
    Image,
    Media,
    ...rest,
  };

  return (
    <>
      {newAttachments?.map((attachment) => {
        if (isGalleryAttachment(attachment)) {
          return renderGallery({
            ...propsWithDefault,
            attachment,
          });
        }

        if (isImageAttachment(attachment)) {
          return renderImage({
            ...propsWithDefault,
            attachment,
          });
        }

        if (isAudioAttachment(attachment)) {
          return renderAudio({
            ...propsWithDefault,
            attachment,
          });
        }

        if (isFileAttachment(attachment)) {
          return renderFile({
            ...propsWithDefault,
            attachment,
          });
        }

        if (isMediaAttachment(attachment)) {
          return renderMedia({
            ...propsWithDefault,
            attachment,
          });
        }

        return renderCard({
          ...propsWithDefault,
          attachment,
        });
      })}
    </>
  );
};
