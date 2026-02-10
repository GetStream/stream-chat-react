import type { PropsWithChildren } from 'react';
import React, { useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type {
  Attachment,
  LocalAttachment,
  SharedLocationResponse,
  VideoAttachment as VideoAttachmentType,
} from 'stream-chat';
import {
  isAudioAttachment,
  isFileAttachment,
  isSharedLocationResponse,
  isVideoAttachment,
  isVoiceRecordingAttachment,
} from 'stream-chat';

import { AttachmentActions as DefaultAttachmentActions } from './AttachmentActions';
import { VoiceRecording as DefaultVoiceRecording } from './VoiceRecording';
import type { GalleryItem } from '../Gallery';
import {
  ImageComponent as DefaultImage,
  ModalGallery as DefaultModalGallery,
} from '../Gallery';
import { Card as DefaultCard } from './LinkPreview/Card';
import { FileAttachment as DefaultFile } from './FileAttachment';
import { Giphy as DefaultGiphy } from './Giphy';
import { Geolocation as DefaultGeolocation } from './Geolocation';
import { UnsupportedAttachment as DefaultUnsupportedAttachment } from './UnsupportedAttachment';
import {
  type AttachmentComponentType,
  type GalleryAttachment,
  type GeolocationContainerProps,
  getCssDimensionsVariables,
  isGalleryAttachmentType,
  isSvgAttachment,
  type RenderAttachmentProps,
  type RenderGalleryProps,
  type RenderMediaProps,
  SUPPORTED_VIDEO_FORMATS,
} from './utils';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import type { ImageAttachmentConfiguration } from '../../types/types';
import { VisibilityDisclaimer } from './VisibilityDisclaimer';
import { VideoAttachment } from './VideoAttachment';
import type { AttachmentProps } from './Attachment';

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
  attachmentActionsDefaultFocus,
}: RenderAttachmentProps) => {
  if (!attachment.actions?.length) return null;

  const defaultFocusedActionValue =
    attachment.type && attachmentActionsDefaultFocus?.[attachment.type];

  return (
    <AttachmentActions
      {...attachment}
      actionHandler={actionHandler}
      actions={attachment.actions}
      defaultFocusedActionValue={defaultFocusedActionValue}
      id={(attachment as LocalAttachment).localMetadata?.id || ''}
      text={attachment.text || ''}
    />
  );
};

export const MediaContainer = (props: RenderMediaProps) => {
  const { attachments: mediaAttachments } = props;
  if (!mediaAttachments.length) return null;

  if (mediaAttachments.length > 1) {
    return (
      <GalleryContainer
        {...props}
        attachment={{ items: mediaAttachments, type: 'gallery' }}
      />
    );
  }

  const mediaAttachment = mediaAttachments[0];
  const { attachments: _attachments, ...rest } = props; // eslint-disable-line @typescript-eslint/no-unused-vars

  if (isVideoAttachment(mediaAttachment, SUPPORTED_VIDEO_FORMATS)) {
    return <VideoContainer attachment={mediaAttachment} {...rest} />;
  }

  return <ImageContainer attachment={mediaAttachment} {...rest} />;
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

export const GiphyContainer = (props: RenderAttachmentProps) => {
  const { attachment, Giphy = DefaultGiphy } = props;
  const componentType = 'giphy';

  if (attachment.actions && attachment.actions.length) {
    return (
      <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
        <div className='str-chat__attachment'>
          <VisibilityDisclaimer />
          <Giphy attachment={attachment} />
          <AttachmentActionsContainer {...props} />
        </div>
      </AttachmentWithinContainer>
    );
  }

  return (
    <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      <Giphy attachment={attachment} />
    </AttachmentWithinContainer>
  );
};

export const FileContainer = (props: RenderAttachmentProps) => {
  const { attachment } = props;

  if (isVoiceRecordingAttachment(attachment)) {
    return <VoiceRecordingContainer {...props} />;
  }

  if (isAudioAttachment(attachment)) {
    return <AudioContainer {...props} />;
  }

  if (!attachment.asset_url || !isFileAttachment(attachment, SUPPORTED_VIDEO_FORMATS)) {
    return null;
  }

  return <OtherFilesContainer {...props} />;
};

export const GalleryContainer = ({
  attachment,
  ModalGallery = DefaultModalGallery,
}: RenderGalleryProps) => (
  <AttachmentWithinContainer attachment={attachment} componentType='gallery'>
    <ModalGallery items={attachment.items as GalleryItem[]} key='gallery' />
  </AttachmentWithinContainer>
);

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

export const OtherFilesContainer = ({
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
  Audio = DefaultFile,
}: RenderAttachmentProps) => (
  <AttachmentWithinContainer attachment={attachment} componentType='audio'>
    <div className='str-chat__attachment'>
      <Audio attachment={attachment} />
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

export const VideoContainer = (
  props: Omit<AttachmentProps, 'attachments'> & { attachment: VideoAttachmentType },
) => {
  const { attachment, Media } = props;
  const componentType = 'media';

  return attachment.actions?.length ? (
    <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      <div className='str-chat__attachment'>
        <VideoAttachment attachment={attachment} VideoPlayer={Media} />
        <AttachmentActionsContainer {...props} />
      </div>
    </AttachmentWithinContainer>
  ) : (
    <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      <VideoAttachment attachment={attachment} VideoPlayer={Media} />
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
