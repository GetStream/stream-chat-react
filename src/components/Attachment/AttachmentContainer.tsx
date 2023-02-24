import React, { PropsWithChildren, useLayoutEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import clsx from 'clsx';

import * as linkify from 'linkifyjs';

import { AttachmentActions as DefaultAttachmentActions } from './AttachmentActions';
import { Audio as DefaultAudio } from './Audio';
import { Gallery as DefaultGallery, ImageComponent as DefaultImage } from '../Gallery';
import { Card as DefaultCard } from './Card';
import { FileAttachment as DefaultFile } from './FileAttachment';
import { NullComponent as DefaultUnsupportedAttachment } from './UnsupportedAttachment';
import {
  AttachmentContainerProps,
  isGalleryAttachmentType,
  isSvgAttachment,
  RenderAttachmentProps,
  RenderGalleryProps,
} from './utils';

import { useChannelStateContext } from '../../context/ChannelStateContext';

import type {
  DefaultStreamChatGenerics,
  ImageAttachmentConfiguration,
  VideoAttachmentConfiguration,
} from '../../types/types';

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

  const classNames = clsx(
    'str-chat__message-attachment str-chat__message-attachment-dynamic-size',
    {
      [`str-chat__message-attachment--${componentType}`]: componentType,
      [`str-chat__message-attachment--${attachment?.type}`]: attachment?.type,
      [`str-chat__message-attachment--${componentType}--${extra}`]: componentType && extra,
      'str-chat__message-attachment--svg-image': isSvgAttachment(attachment),
      'str-chat__message-attachment-with-actions': extra === 'actions', // added for theme V2 (better readability)
    },
  );

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

function getCssDimensionsVariables(url: string) {
  const cssVars = {
    '--original-height': 1000000,
    '--original-width': 1000000,
  } as Record<string, number>;

  if (linkify.test(url, 'url')) {
    const urlParams = new URL(url).searchParams;
    const oh = Number(urlParams.get('oh'));
    const ow = Number(urlParams.get('ow'));
    const originalHeight = oh > 1 ? oh : 1000000;
    const originalWidth = ow > 1 ? ow : 1000000;
    cssVars['--original-width'] = originalWidth;
    cssVars['--original-height'] = originalHeight;
  }

  return cssVars;
}

export const GalleryContainer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  attachment,
  Gallery = DefaultGallery,
}: RenderGalleryProps<StreamChatGenerics>) => {
  const imageElements = useRef<HTMLElement[]>([]);
  const { imageAttachmentSizeHandler } = useChannelStateContext();
  const [attachmentConfigurations, setAttachmentConfigurations] = useState<
    ImageAttachmentConfiguration[]
  >([]);

  useLayoutEffect(() => {
    if (
      imageElements.current &&
      imageElements.current.every((element) => !!element) &&
      imageAttachmentSizeHandler
    ) {
      const newConfigurations: ImageAttachmentConfiguration[] = [];
      imageElements.current.forEach((element, i) => {
        const config = imageAttachmentSizeHandler(attachment.images[i], element);
        newConfigurations.push(config);
      });
      setAttachmentConfigurations(newConfigurations);
    }
  }, [imageElements, imageAttachmentSizeHandler, attachment]);

  const images = attachment.images.map((image, i) => ({
    ...image,
    previewUrl: attachmentConfigurations[i]?.url || 'about:blank',
    style: getCssDimensionsVariables(
      attachment.images[i]?.image_url || attachment.images[i]?.thumb_url || '',
    ),
  }));

  return (
    <AttachmentWithinContainer attachment={attachment} componentType='gallery'>
      <Gallery images={images || []} innerRefs={imageElements} key='gallery' />
    </AttachmentWithinContainer>
  );
};

export const ImageContainer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: RenderAttachmentProps<StreamChatGenerics>,
) => {
  const { attachment, Image = DefaultImage } = props;
  const componentType = 'image';
  const imageElement = useRef<HTMLImageElement>(null);
  const { imageAttachmentSizeHandler } = useChannelStateContext();
  const [attachmentConfiguration, setAttachmentConfiguration] = useState<
    ImageAttachmentConfiguration | undefined
  >(undefined);

  useLayoutEffect(() => {
    if (imageElement.current && imageAttachmentSizeHandler) {
      const config = imageAttachmentSizeHandler(attachment, imageElement.current);
      setAttachmentConfiguration(config);
    }
  }, [imageElement, imageAttachmentSizeHandler, attachment]);

  const imageConfig = {
    ...attachment,
    previewUrl: attachmentConfiguration?.url || 'about:blank',
    style: getCssDimensionsVariables(attachment.image_url || attachment.thumb_url || ''),
  };

  if (attachment.actions && attachment.actions.length) {
    return (
      <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
        <div className='str-chat__attachment'>
          <Image {...imageConfig} innerRef={imageElement} />
          <AttachmentActionsContainer {...props} />
        </div>
      </AttachmentWithinContainer>
    );
  }

  return (
    <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      <Image {...imageConfig} innerRef={imageElement} />
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
  const { shouldGenerateVideoThumbnail, videoAttachmentSizeHandler } = useChannelStateContext();
  const videoElement = useRef<HTMLDivElement>(null);
  const [
    attachmentConfiguration,
    setAttachmentConfiguration,
  ] = useState<VideoAttachmentConfiguration>();

  useLayoutEffect(() => {
    if (videoElement.current && videoAttachmentSizeHandler) {
      const config = videoAttachmentSizeHandler(
        attachment,
        videoElement.current,
        shouldGenerateVideoThumbnail,
      );
      setAttachmentConfiguration(config);
    }
  }, [videoElement, videoAttachmentSizeHandler, attachment]);

  const content = (
    <div
      className='str-chat__player-wrapper'
      data-testid='video-wrapper'
      ref={videoElement}
      style={getCssDimensionsVariables(attachment.thumb_url || '')}
    >
      <Media
        className='react-player'
        config={{ file: { attributes: { poster: attachmentConfiguration?.thumbUrl } } }}
        controls
        height='100%'
        url={attachmentConfiguration?.url}
        width='100%'
      />
    </div>
  );

  return attachment.actions?.length ? (
    <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      <div className='str-chat__attachment str-chat__attachment-media'>
        {content}
        <AttachmentActionsContainer {...props} />
      </div>
    </AttachmentWithinContainer>
  ) : (
    <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      {content}
    </AttachmentWithinContainer>
  );
};

export const UnsupportedAttachmentContainer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  attachment,
  UnsupportedAttachment = DefaultUnsupportedAttachment,
}: RenderAttachmentProps<StreamChatGenerics>) => (
  <>
    <UnsupportedAttachment attachment={attachment} />
  </>
);
