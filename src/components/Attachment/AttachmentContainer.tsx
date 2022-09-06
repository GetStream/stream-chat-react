import React, { PropsWithChildren } from 'react';
import ReactPlayer from 'react-player';
import clsx from 'clsx';

import { AttachmentActions as DefaultAttachmentActions } from './AttachmentActions';
import { Audio as DefaultAudio } from './Audio';
import { Gallery as DefaultGallery, ImageComponent as DefaultImage } from '../Gallery';
import { Card as DefaultCard } from './Card';
import { FileAttachment as DefaultFile } from './FileAttachment';
import {
  AttachmentContainerProps,
  isGalleryAttachmentType,
  isSvgAttachment,
  RenderAttachmentProps,
  RenderGalleryProps,
} from './utils';

import type { DefaultStreamChatGenerics } from '../../types/types';

export const AttachmentWithinContainer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  attachment,
  children,
  componentType,
}: PropsWithChildren<AttachmentContainerProps<StreamChatGenerics>>) => {
  const isGAT = isGalleryAttachmentType(attachment);
  let extra = '';

  if (!isGAT) {
    extra =
      componentType === 'card' && !attachment?.image_url && !attachment?.thumb_url
        ? 'no-image'
        : attachment?.actions?.length
        ? 'actions'
        : '';
  }

  const classNames = clsx('str-chat__message-attachment', {
    [`str-chat__message-attachment--${componentType}`]: componentType,
    [`str-chat__message-attachment--${attachment?.type}`]: attachment?.type,
    [`str-chat__message-attachment--${componentType}--${extra}`]: componentType && extra,
    'str-chat__message-attachment--svg-image': isSvgAttachment(attachment),
    'str-chat__message-attachment-with-actions': extra === 'actions', // added for theme V2 (better readability)
  });

  return <div className={classNames}>{children}</div>;
};

export const AttachmentActionsContainer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  actionHandler,
  attachment,
  AttachmentActions = DefaultAttachmentActions,
}: RenderAttachmentProps<StreamChatGenerics>) => {
  if (!attachment.actions?.length) return null;

  return (
    <AttachmentActions
      {...attachment}
      actionHandler={actionHandler}
      actions={attachment.actions}
      id={attachment.id || ''}
      text={attachment.text || ''}
    />
  );
};

export const GalleryContainer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  attachment,
  Gallery = DefaultGallery,
}: RenderGalleryProps<StreamChatGenerics>) => (
  <AttachmentWithinContainer attachment={attachment} componentType='gallery'>
    <Gallery images={attachment.images || []} key='gallery' />
  </AttachmentWithinContainer>
);

export const ImageContainer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: RenderAttachmentProps<StreamChatGenerics>,
) => {
  const { attachment, Image = DefaultImage } = props;
  const componentType = 'image';

  if (attachment.actions && attachment.actions.length) {
    return (
      <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
        <div className='str-chat__attachment'>
          <Image {...attachment} />
          <AttachmentActionsContainer {...props} />
        </div>
      </AttachmentWithinContainer>
    );
  }

  return (
    <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      <Image {...attachment} />
    </AttachmentWithinContainer>
  );
};

export const CardContainer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: RenderAttachmentProps<StreamChatGenerics>,
) => {
  const { attachment, Card = DefaultCard } = props;
  const componentType = 'card';

  if (attachment.actions && attachment.actions.length) {
    return (
      <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
        <div className='str-chat__attachment'>
          <Card {...attachment} />
          <AttachmentActionsContainer {...props} />
        </div>
      </AttachmentWithinContainer>
    );
  }

  return (
    <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      <Card {...attachment} />
    </AttachmentWithinContainer>
  );
};

export const FileContainer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  attachment,
  File = DefaultFile,
}: RenderAttachmentProps<StreamChatGenerics>) => {
  if (!attachment.asset_url) return null;

  return (
    <AttachmentWithinContainer attachment={attachment} componentType='file'>
      <File attachment={attachment} />
    </AttachmentWithinContainer>
  );
};
export const AudioContainer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  attachment,
  Audio = DefaultAudio,
}: RenderAttachmentProps<StreamChatGenerics>) => (
  <AttachmentWithinContainer attachment={attachment} componentType='audio'>
    <div className='str-chat__attachment'>
      <Audio og={attachment} />
    </div>
  </AttachmentWithinContainer>
);

export const MediaContainer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: RenderAttachmentProps<StreamChatGenerics>,
) => {
  const { attachment, Media = ReactPlayer } = props;
  const componentType = 'media';

  if (attachment.actions?.length) {
    return (
      <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
        <div className='str-chat__attachment str-chat__attachment-media'>
          <div className='str-chat__player-wrapper'>
            <Media
              className='react-player'
              controls
              height='100%'
              url={attachment.asset_url}
              width='100%'
            />
          </div>
          <AttachmentActionsContainer {...props} />
        </div>
      </AttachmentWithinContainer>
    );
  }

  return (
    <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      <div className='str-chat__player-wrapper'>
        <Media
          className='react-player'
          controls
          height='100%'
          url={attachment.asset_url}
          width='100%'
        />
      </div>
    </AttachmentWithinContainer>
  );
};
