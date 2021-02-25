import React, { PropsWithChildren } from 'react';
// @ts-expect-error
import { DefaultMedia, ReactPlayerProps } from 'react-player';

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
  Gallery as DefaultGallery,
  ImageComponent as DefaultImage,
  GalleryProps,
  ImageProps,
} from '../Gallery';

import type { Attachment as StreamAttachment } from 'stream-chat';

import type { UnknownType } from '../../../types/types';

export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/ogg',
  'video/webm',
  'video/quicktime',
];

export type InnerAttachmentUIComponentProps = BaseAttachmentUIComponentProps & {
  attachment: ExtendedAttachment;
};

export type WrapperAttachmentUIComponentProps = BaseAttachmentUIComponentProps & {
  attachments: ExtendedAttachment[];
};

export type BaseAttachmentUIComponentProps = {
  /** The attachment to render */
  /**
		The handler function to call when an action is selected on an attachment.
		Examples include canceling a \/giphy command or shuffling the results.
		*/
  actionHandler?: (
    name: string | UnknownType,
    value?: string,
    event?: React.BaseSyntheticEvent,
  ) => void;
  AttachmentActions?: React.ComponentType<AttachmentActionsProps>;
  Audio?: React.ComponentType<AudioProps>;
  Card?: React.ComponentType<CardProps>;
  File?: React.ComponentType<FileAttachmentProps>;
  Gallery?: React.ComponentType<GalleryProps>;
  Image?: React.ComponentType<ImageProps>;
  Media?: React.ComponentType<ReactPlayerProps>;
};

export type AttachmentProps = {
  /**
   * The attachment to render
   * See [Attachment structure](https://getstream.io/chat/docs/#message_format)
   **/
  attachments: ExtendedAttachment[];
  /**
   * Handle for click on action on Attachment
   */
  actionHandler?: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    name?: string,
    value?: string,
  ) => void;
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
   * Defaults to [Image](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Image.js)
   */
  Image?: React.ComponentType<ImageProps>;

  /**
   * Custom UI component for media type attachment
   * Defaults to ReactPlayer from 'react-player'
   */
  Media?: React.ComponentType<ReactPlayerProps>;
};

export type ExtendedAttachment = StreamAttachment & {
  asset_url?: string;
  id?: string;
  images?: Array<{
    image_url?: string;
    thumb_url?: string;
  }>;
  mime_type?: string;
};

export type DefaultProps = Required<
  Pick<
    InnerAttachmentUIComponentProps,
    | 'Card'
    | 'File'
    | 'Gallery'
    | 'Image'
    | 'Audio'
    | 'Media'
    | 'AttachmentActions'
  >
> & {
  attachment: ExtendedAttachment;
  componentType: string;
};

export const isGalleryAttachment = (attachment: ExtendedAttachment) =>
  attachment.type === 'gallery';

export const isImageAttachment = (attachment: ExtendedAttachment) =>
  attachment.type === 'image' &&
  !attachment.title_link &&
  !attachment.og_scrape_url;

export const isMediaAttachment = (attachment: ExtendedAttachment) =>
  (attachment.mime_type &&
    SUPPORTED_VIDEO_FORMATS.indexOf(attachment.mime_type) !== -1) ||
  attachment.type === 'video';

export const isAudioAttachment = (attachment: ExtendedAttachment) =>
  attachment.type === 'audio';

export const isFileAttachment = (attachment: ExtendedAttachment) =>
  attachment.type === 'file' ||
  (attachment.mime_type &&
    SUPPORTED_VIDEO_FORMATS.indexOf(attachment.mime_type) === -1 &&
    attachment.type !== 'video');

export const renderAttachmentWithinContainer = (
  props: PropsWithChildren<Partial<DefaultProps>>,
) => {
  const { attachment, children, componentType } = props;
  const extra =
    componentType === 'card' && !attachment?.image_url && !attachment?.thumb_url
      ? 'no-image'
      : attachment && attachment.actions && attachment.actions.length
      ? 'actions'
      : '';

  return (
    <div
      className={`str-chat__message-attachment str-chat__message-attachment--${componentType} str-chat__message-attachment--${
        attachment?.type || ''
      } str-chat__message-attachment--${componentType}--${extra}`}
      key={`${attachment?.id}-${attachment?.type || 'none'} `}
    >
      {children}
    </div>
  );
};

export const renderAttachmentActions = (
  props: InnerAttachmentUIComponentProps,
) => {
  const { actionHandler, attachment, AttachmentActions } = props;
  if (!AttachmentActions) return null;
  if (!attachment.actions || !attachment.actions.length) {
    return null;
  }

  return (
    <AttachmentActions
      {...attachment}
      actionHandler={() => actionHandler}
      actions={attachment.actions || []}
      id={attachment.id || ''}
      key={`key-actions-${attachment.id}`}
      text={attachment.text || ''}
    />
  );
};

export const renderGallery = (props: InnerAttachmentUIComponentProps) => {
  const { attachment, Gallery } = props;
  if (!Gallery) return null;
  return renderAttachmentWithinContainer({
    attachment,
    children: <Gallery images={attachment.images || []} key='gallery' />,
    componentType: 'gallery',
  });
};

export const renderImage = (props: InnerAttachmentUIComponentProps) => {
  const { attachment, Image } = props;
  if (!Image) return null;
  if (attachment.actions && attachment.actions.length) {
    return renderAttachmentWithinContainer({
      attachment,
      children: (
        <div
          className='str-chat__attachment'
          key={`key-image-${attachment.id}`}
        >
          {<Image {...attachment} />}
          {renderAttachmentActions(props)}
        </div>
      ),
      componentType: 'image',
    });
  }

  return renderAttachmentWithinContainer({
    attachment,
    children: <Image {...attachment} key={`key-image-${attachment.id}`} />,
    componentType: 'image',
  });
};

export const renderCard = (props: InnerAttachmentUIComponentProps) => {
  const { attachment: attachment, Card } = props;
  if (!Card) return null;
  if (attachment.actions && attachment.actions.length) {
    return renderAttachmentWithinContainer({
      attachment,
      children: (
        <div
          className='str-chat__attachment'
          key={`key-image-${attachment.id}`}
        >
          <Card {...attachment} key={`key-card-${attachment.id}`} />
          {renderAttachmentActions(props)}
        </div>
      ),
      componentType: 'card',
    });
  }

  return renderAttachmentWithinContainer({
    attachment,
    children: <Card {...attachment} key={`key-card-${attachment.id}`} />,
    componentType: 'card',
  });
};

export const renderFile = (props: InnerAttachmentUIComponentProps) => {
  const { attachment: attachment, File } = props;
  if (!attachment.asset_url || !File) return null;

  return renderAttachmentWithinContainer({
    attachment,
    children: (
      <File attachment={attachment} key={`key-file-${attachment.id}`} />
    ),
    componentType: 'file',
  });
};

export const renderAudio = (props: InnerAttachmentUIComponentProps) => {
  const { attachment: attachment, Audio } = props;
  if (!Audio) return null;
  return renderAttachmentWithinContainer({
    attachment,
    children: (
      <div className='str-chat__attachment' key={`key-video-${attachment.id}`}>
        <Audio og={attachment} />
      </div>
    ),
    componentType: 'audio',
  });
};

export const renderMedia = (props: InnerAttachmentUIComponentProps) => {
  const { attachment, Media } = props;
  if (!Media) return null;

  if (attachment.actions && attachment.actions.length) {
    return renderAttachmentWithinContainer({
      attachment,
      children: (
        <div
          className='str-chat__attachment str-chat__attachment-media'
          key={`key-video-${attachment.id}`}
        >
          <div className='str-chat__player-wrapper'>
            <Media
              className='react-player'
              controls
              height='100%'
              url={attachment.asset_url}
              width='100%'
            />
          </div>
          {renderAttachmentActions(props)}
        </div>
      ),
      componentType: 'media',
    });
  }

  return renderAttachmentWithinContainer({
    attachment,
    children: (
      <div
        className='str-chat__player-wrapper'
        key={`key-video-${attachment.id}`}
      >
        {' '}
        <Media
          className='react-player'
          controls
          height='100%'
          url={attachment.asset_url}
          width='100%'
        />
      </div>
    ),
    componentType: 'media',
  });
};

/**
 * Attachment - The message attachment
 *
 * @example ../../docs/Attachment.md
 */
export const Attachment: React.FC<WrapperAttachmentUIComponentProps> = (
  props,
) => {
  const {
    attachments,
    Card = DefaultCard,
    Image = DefaultImage,
    Gallery = DefaultGallery,
    Audio = DefaultAudio,
    File = DefaultFile,
    Media = DefaultMedia,
    AttachmentActions = DefaultAttachmentActions,
    ...rest
  } = props;

  const gallery = {
    images: attachments.filter(
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
