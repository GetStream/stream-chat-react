import type { PropsWithChildren } from 'react';
import React, { useLayoutEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import clsx from 'clsx';
import * as linkify from 'linkifyjs';
import type { Attachment, LocalAttachment, SharedLocationResponse } from 'stream-chat';
import { isSharedLocationResponse } from 'stream-chat';

import { AttachmentActions as DefaultAttachmentActions } from './AttachmentActions';
import { Audio as DefaultAudio } from './Audio';
import { VoiceRecording as DefaultVoiceRecording } from './VoiceRecording';
import { Gallery as DefaultGallery, ImageComponent as DefaultImage } from '../Gallery';
import { Card as DefaultCard } from './Card';
import { FileAttachment as DefaultFile } from './FileAttachment';
import { Geolocation as DefaultGeolocation } from './Geolocation';
import { UnsupportedAttachment as DefaultUnsupportedAttachment } from './UnsupportedAttachment';
import type {
  AttachmentComponentType,
  GalleryAttachment,
  GeolocationContainerProps,
  RenderAttachmentProps,
  RenderGalleryProps,
} from './utils';
import { isGalleryAttachmentType, isSvgAttachment } from './utils';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import type {
  ImageAttachmentConfiguration,
  VideoAttachmentConfiguration,
} from '../../types/types';

export type AttachmentContainerProps = {
  attachment: Attachment | GalleryAttachment | SharedLocationResponse;
  componentType: AttachmentComponentType;
};
export const AttachmentWithinContainer = ({
  attachment,
  children,
  componentType,
}: PropsWithChildren<AttachmentContainerProps>) => {
  const isGAT = isGalleryAttachmentType(attachment);
  let extra = '';

  if (!isGAT && !isSharedLocationResponse(attachment)) {
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
      [`str-chat__message-attachment--${(attachment as Attachment)?.type}`]: (
        attachment as Attachment
      )?.type,
      [`str-chat__message-attachment--${componentType}--${extra}`]:
        componentType && extra,
      'str-chat__message-attachment--svg-image': isSvgAttachment(attachment),
      'str-chat__message-attachment-with-actions': extra === 'actions',
    },
  );

  return <div className={classNames}>{children}</div>;
};

export const AttachmentActionsContainer = ({
  actionHandler,
  attachment,
  AttachmentActions = DefaultAttachmentActions,
}: RenderAttachmentProps) => {
  if (!attachment.actions?.length) return null;

  return (
    <AttachmentActions
      {...attachment}
      actionHandler={actionHandler}
      actions={attachment.actions}
      id={(attachment as LocalAttachment).localMetadata?.id || ''}
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

export const GalleryContainer = ({
  attachment,
  Gallery = DefaultGallery,
}: RenderGalleryProps) => {
  const imageElements = useRef<HTMLElement[]>([]);
  const { imageAttachmentSizeHandler } = useChannelStateContext();
  const [attachmentConfigurations, setAttachmentConfigurations] = useState<
    ImageAttachmentConfiguration[]
  >([]);

  useLayoutEffect(() => {
    if (!imageElements.current || !imageAttachmentSizeHandler) return;
    const newConfigurations: ImageAttachmentConfiguration[] = [];
    const nonNullImageElements = imageElements.current.filter((e) => !!e);
    if (nonNullImageElements.length < imageElements.current.length) {
      imageElements.current = nonNullImageElements;
    }
    imageElements.current.forEach((element, i) => {
      if (!element) return;
      const config = imageAttachmentSizeHandler(attachment.images[i], element);
      newConfigurations.push(config);
    });
    setAttachmentConfigurations(newConfigurations);
  }, [imageAttachmentSizeHandler, attachment]);

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

export const ImageContainer = (props: RenderAttachmentProps) => {
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

export const CardContainer = (props: RenderAttachmentProps) => {
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

export const FileContainer = ({
  attachment,
  File = DefaultFile,
}: RenderAttachmentProps) => {
  if (!attachment.asset_url) return null;

  return (
    <AttachmentWithinContainer attachment={attachment} componentType='file'>
      <File attachment={attachment} />
    </AttachmentWithinContainer>
  );
};
export const AudioContainer = ({
  attachment,
  Audio = DefaultAudio,
}: RenderAttachmentProps) => (
  <AttachmentWithinContainer attachment={attachment} componentType='audio'>
    <div className='str-chat__attachment'>
      <Audio og={attachment} />
    </div>
  </AttachmentWithinContainer>
);

export const VoiceRecordingContainer = ({
  attachment,
  isQuoted,
  VoiceRecording = DefaultVoiceRecording,
}: RenderAttachmentProps) => (
  <AttachmentWithinContainer attachment={attachment} componentType='voiceRecording'>
    <div className='str-chat__attachment'>
      <VoiceRecording attachment={attachment} isQuoted={isQuoted} />
    </div>
  </AttachmentWithinContainer>
);

export const MediaContainer = (props: RenderAttachmentProps) => {
  const { attachment, Media = ReactPlayer } = props;
  const componentType = 'media';
  const { shouldGenerateVideoThumbnail, videoAttachmentSizeHandler } =
    useChannelStateContext();
  const videoElement = useRef<HTMLDivElement>(null);
  const [attachmentConfiguration, setAttachmentConfiguration] =
    useState<VideoAttachmentConfiguration>();

  useLayoutEffect(() => {
    if (videoElement.current && videoAttachmentSizeHandler) {
      const config = videoAttachmentSizeHandler(
        attachment,
        videoElement.current,
        shouldGenerateVideoThumbnail,
      );
      setAttachmentConfiguration(config);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className='str-chat__attachment'>
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

export const GeolocationContainer = ({
  Geolocation = DefaultGeolocation,
  location,
}: GeolocationContainerProps) => (
  <AttachmentWithinContainer attachment={location} componentType='geolocation'>
    <Geolocation location={location} />
  </AttachmentWithinContainer>
);

export const UnsupportedAttachmentContainer = ({
  attachment,
  UnsupportedAttachment = DefaultUnsupportedAttachment,
}: RenderAttachmentProps) => (
  <>
    <UnsupportedAttachment attachment={attachment} />
  </>
);
