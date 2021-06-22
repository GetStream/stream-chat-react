import React from 'react';

import {
  isAudioAttachment,
  isFileAttachment,
  isGalleryAttachmentType,
  isImageAttachment,
  isMediaAttachment,
  renderAudio,
  renderCard,
  renderFile,
  renderGallery,
  renderImage,
  renderMedia,
} from './utils';

import type { ReactPlayerProps } from 'react-player';
import type { Attachment as StreamAttachment } from 'stream-chat';

import type { AttachmentActionsProps } from './AttachmentActions';
import type { AudioProps } from './Audio';
import type { CardProps } from './Card';
import type { FileAttachmentProps } from './FileAttachment';
import type { GalleryProps, ImageProps } from '../Gallery';
import type { ActionHandlerReturnType } from '../Message/hooks/useActionHandler';

import type { DefaultAttachmentType } from '../../types/types';

export type AttachmentProps<At extends DefaultAttachmentType = DefaultAttachmentType> = {
  /** The message attachments to render, see [attachment structure](https://getstream.io/chat/docs/javascript/message_format/?language=javascript) **/
  attachments: StreamAttachment<At>[];
  /**	The handler function to call when an action is performed on an attachment, examples include canceling a \/giphy command or shuffling the results. */
  actionHandler?: ActionHandlerReturnType;
  /** Custom UI component for displaying attachment actions, defaults to and accepts same props as: [AttachmentActions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/AttachmentActions.tsx) */
  AttachmentActions?: React.ComponentType<AttachmentActionsProps<At>>;
  /** Custom UI component for displaying an audio type attachment, defaults to and accepts same props as: [Audio](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Audio.tsx) */
  Audio?: React.ComponentType<AudioProps<At>>;
  /** Custom UI component for displaying a card type attachment, defaults to and accepts same props as: [Card](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Card.tsx) */
  Card?: React.ComponentType<CardProps>;
  /** Custom UI component for displaying a file type attachment, defaults to and accepts same props as: [File](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/FileAttachment.tsx) */
  File?: React.ComponentType<FileAttachmentProps<At>>;
  /** Custom UI component for displaying a gallery of image type attachments, defaults to and accepts same props as: [Gallery](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Gallery.tsx) */
  Gallery?: React.ComponentType<GalleryProps<At>>;
  /** Custom UI component for displaying an image type attachment, defaults to and accepts same props as: [Image](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Image.tsx) */
  Image?: React.ComponentType<ImageProps>;
  /** Custom UI component for displaying a media type attachment, defaults to `ReactPlayer` from 'react-player' */
  Media?: React.ComponentType<ReactPlayerProps>;
};

/**
 * A component used for rendering message attachments. By default, the component supports: AttachmentActions, Audio, Card, File, Gallery, Image, and Video
 */
export const Attachment = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  props: AttachmentProps<At>,
) => {
  const { attachments, ...rest } = props;

  const gallery = {
    images: attachments?.filter(
      (attachment) =>
        attachment.type === 'image' && !(attachment.og_scrape_url || attachment.title_link),
    ),
    type: 'gallery',
  };

  const newAttachments =
    gallery.images.length >= 2
      ? [
          ...attachments.filter(
            (attachment) =>
              !(
                attachment.type === 'image' && !(attachment.og_scrape_url || attachment.title_link)
              ),
          ),
          gallery,
        ]
      : attachments;

  return (
    <>
      {newAttachments.map((attachment) => {
        if (isGalleryAttachmentType(attachment)) {
          return renderGallery({ ...rest, attachment });
        }

        if (isImageAttachment(attachment)) {
          return renderImage({ ...rest, attachment });
        }

        if (isAudioAttachment(attachment)) {
          return renderAudio({ ...rest, attachment });
        }

        if (isFileAttachment(attachment)) {
          return renderFile({ ...rest, attachment });
        }

        if (isMediaAttachment(attachment)) {
          return renderMedia({ ...rest, attachment });
        }

        return renderCard({ ...rest, attachment });
      })}
    </>
  );
};
