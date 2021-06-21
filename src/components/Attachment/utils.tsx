import React, { PropsWithChildren } from 'react';
import ReactPlayer from 'react-player';

import { AttachmentActions as DefaultAttachmentActions } from './AttachmentActions';
import { Audio as DefaultAudio } from './Audio';
import { Card as DefaultCard } from './Card';
import { FileAttachment as DefaultFile } from './FileAttachment';
import { Gallery as DefaultGallery, ImageComponent as DefaultImage } from '../Gallery';

import type { Attachment } from 'stream-chat';
import type { AttachmentProps } from './Attachment';
import type { DefaultAttachmentType } from '../../types/types';

export const SUPPORTED_VIDEO_FORMATS = ['video/mp4', 'video/ogg', 'video/webm', 'video/quicktime'];

export type GalleryAttachment<At extends DefaultAttachmentType = DefaultAttachmentType> = {
  images: Attachment<At>[];
  type: string;
};

export type AttachmentContainerProps<At extends DefaultAttachmentType = DefaultAttachmentType> = {
  attachment: Attachment<At> | GalleryAttachment<At>;
  componentType: string;
};

export type RenderAttachmentProps<At extends DefaultAttachmentType = DefaultAttachmentType> = Omit<
  AttachmentProps<At>,
  'attachments'
> & {
  attachment: Attachment<At>;
};

export type RenderGalleryProps<At extends DefaultAttachmentType = DefaultAttachmentType> = Omit<
  AttachmentProps<At>,
  'attachments'
> & {
  attachment: GalleryAttachment<At>;
};

export const isGalleryAttachmentType = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  output: Attachment<At> | GalleryAttachment<At>,
): output is GalleryAttachment<At> => (output as GalleryAttachment<At>).images != null;

export const isAudioAttachment = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  attachment: Attachment<At>,
) => attachment.type === 'audio';

export const isFileAttachment = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  attachment: Attachment<At>,
) =>
  attachment.type === 'file' ||
  (attachment.mime_type &&
    SUPPORTED_VIDEO_FORMATS.indexOf(attachment.mime_type) === -1 &&
    attachment.type !== 'video');

export const isImageAttachment = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  attachment: Attachment<At>,
) => attachment.type === 'image' && !attachment.title_link && !attachment.og_scrape_url;

export const isMediaAttachment = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  attachment: Attachment<At>,
) =>
  (attachment.mime_type && SUPPORTED_VIDEO_FORMATS.indexOf(attachment.mime_type) !== -1) ||
  attachment.type === 'video';

export const renderAttachmentWithinContainer = <
  At extends DefaultAttachmentType = DefaultAttachmentType
>(
  props: PropsWithChildren<AttachmentContainerProps<At>>,
) => {
  const { attachment, children, componentType } = props;

  let extra = '';

  if (!isGalleryAttachmentType(attachment)) {
    extra =
      componentType === 'card' && !attachment?.image_url && !attachment?.thumb_url
        ? 'no-image'
        : attachment && attachment.actions && attachment.actions.length
        ? 'actions'
        : '';
  }

  return (
    <div
      className={`str-chat__message-attachment str-chat__message-attachment--${componentType} str-chat__message-attachment--${
        attachment?.type || ''
      } str-chat__message-attachment--${componentType}--${extra}`}
      key={`${isGalleryAttachmentType(attachment) ? '' : attachment?.id}-${
        attachment?.type || 'none'
      } `}
    >
      {children}
    </div>
  );
};

export const renderAttachmentActions = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  props: RenderAttachmentProps<At>,
) => {
  const { actionHandler, attachment, AttachmentActions = DefaultAttachmentActions } = props;

  if (!attachment.actions?.length) return null;

  return (
    <AttachmentActions
      {...attachment}
      actionHandler={(event, name, value) => actionHandler?.(event, name, value)}
      actions={attachment.actions}
      id={attachment.id || ''}
      key={`key-actions-${attachment.id}`}
      text={attachment.text || ''}
    />
  );
};

export const renderGallery = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  props: RenderGalleryProps<At>,
) => {
  const { attachment, Gallery = DefaultGallery } = props;

  return renderAttachmentWithinContainer({
    attachment,
    children: <Gallery images={attachment.images || []} key='gallery' />,
    componentType: 'gallery',
  });
};

export const renderImage = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  props: RenderAttachmentProps<At>,
) => {
  const { attachment, Image = DefaultImage } = props;

  if (attachment.actions && attachment.actions.length) {
    return renderAttachmentWithinContainer({
      attachment,
      children: (
        <div className='str-chat__attachment' key={`key-image-${attachment.id}`}>
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

export const renderCard = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  props: RenderAttachmentProps<At>,
) => {
  const { attachment, Card = DefaultCard } = props;

  if (attachment.actions && attachment.actions.length) {
    return renderAttachmentWithinContainer({
      attachment,
      children: (
        <div className='str-chat__attachment' key={`key-image-${attachment.id}`}>
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

export const renderFile = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  props: RenderAttachmentProps<At>,
) => {
  const { attachment, File = DefaultFile } = props;

  if (!attachment.asset_url) return null;

  return renderAttachmentWithinContainer({
    attachment,
    children: <File attachment={attachment} key={`key-file-${attachment.id}`} />,
    componentType: 'file',
  });
};

export const renderAudio = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  props: RenderAttachmentProps<At>,
) => {
  const { attachment, Audio = DefaultAudio } = props;

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

export const renderMedia = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  props: RenderAttachmentProps<At>,
) => {
  const { attachment, Media = ReactPlayer } = props;

  if (attachment.actions?.length) {
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
      <div className='str-chat__player-wrapper' key={`key-video-${attachment.id}`}>
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
