import React from 'react';
import ReactPlayer, { ReactPlayerProps } from 'react-player';

import {
  AttachmentActionsProps,
  AttachmentActions as DefaultAttachmentActions,
} from './AttachmentActions';
import { AudioProps, Audio as DefaultAudio } from './Audio';
import { CardProps, Card as DefaultCard } from './Card';
import {
  FileAttachment as DefaultFile,
  FileAttachmentProps,
} from './FileAttachment';
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

import type { DefaultAttachmentType } from '../../../types/types';

export type AttachmentProps<
  At extends DefaultAttachmentType = DefaultAttachmentType
> = {
  /**
   * The attachment to render
   * See [Attachment structure](https://getstream.io/chat/docs/#message_format)
   **/
  attachments: ExtendedAttachment<At>[];
  /**
		The handler function to call when an action is selected on an attachment.
		Examples include canceling a \/giphy command or shuffling the results.
		*/
  actionHandler?: ActionHandlerReturnType;
  /**
   * Custom UI component for attachment actions
   * Defaults to [AttachmentActions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/AttachmentActions.tsx)
   */
  AttachmentActions?: React.ComponentType<AttachmentActionsProps>;
  /**
   * Custom UI component for audio type attachment
   * Defaults to [Audio](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Audio.tsx)
   */
  Audio?: React.ComponentType<AudioProps>;
  /**
   * Custom UI component for card type attachment
   * Defaults to [Card](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Card.tsx)
   */
  Card?: React.ComponentType<CardProps>;
  /**
   * Custom UI component for file type attachment
   * Defaults to [File](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/FileAttachment.tsx)
   */
  File?: React.ComponentType<FileAttachmentProps>;
  /**
   * Custom UI component for gallery type attachment
   * Defaults to [AttachmentActions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Gallery.tsx)
   */
  Gallery?: React.ComponentType<GalleryProps>;
  /**
   * Custom UI component for image type attachment
   * Defaults to [Image](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Image.tsx)
   */
  Image?: React.ComponentType<ImageProps>;
  /**
   * Custom UI component for media type attachment
   * Defaults to ReactPlayer from 'react-player'
   */
  Media?: React.ComponentType<ReactPlayerProps>;
};

export type BaseAttachmentUIComponentProps = {
  /**
   * The handler function to call when an action is selected on an attachment.
   * Examples include canceling a \/giphy command or shuffling the results.
   */
  actionHandler?: ActionHandlerReturnType;
  AttachmentActions?: React.ComponentType<AttachmentActionsProps>;
  Audio?: React.ComponentType<AudioProps>;
  Card?: React.ComponentType<CardProps>;
  File?: React.ComponentType<FileAttachmentProps>;
  Gallery?: React.ComponentType<GalleryProps>;
  Image?: React.ComponentType<ImageProps>;
  Media?: React.ComponentType<ReactPlayerProps>;
};

export type DefaultAttachmentProps<
  At extends DefaultAttachmentType = DefaultAttachmentType
> = Required<
  Pick<
    InnerAttachmentUIComponentProps,
    | 'AttachmentActions'
    | 'Audio'
    | 'Card'
    | 'File'
    | 'Gallery'
    | 'Image'
    | 'Media'
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
> = BaseAttachmentUIComponentProps & {
  attachment: ExtendedAttachment<At>;
};

export type WrapperAttachmentUIComponentProps<
  At extends DefaultAttachmentType = DefaultAttachmentType
> = BaseAttachmentUIComponentProps & {
  attachments: ExtendedAttachment<At>[];
};

/**
 * Attachment - The message attachment
 * @example ./Attachment.md
 */
export const Attachment = <
  At extends DefaultAttachmentType = DefaultAttachmentType
>(
  props: WrapperAttachmentUIComponentProps<At>,
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
        attachment.type === 'image' &&
        !(attachment.og_scrape_url || attachment.title_link),
    ),
    type: 'gallery',
  };

  let newAttachments;

  if (gallery.images?.length >= 2) {
    newAttachments = [
      ...attachments.filter(
        (attachment) =>
          !(
            attachment.type === 'image' &&
            !(attachment.og_scrape_url || attachment.title_link)
          ),
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

        if (isFileAttachment(attachment)) {
          return renderFile({
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
