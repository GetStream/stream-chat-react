import React, {
  type PropsWithChildren,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

import { Audio as DefaultAudioAttachment } from './Audio';
import { AttachmentActions as DefaultAttachmentActions } from './AttachmentActions';
import { VoiceRecording as DefaultVoiceRecording } from './VoiceRecording';
import { type GalleryItem, toGalleryItemDescriptors } from '../Gallery';
import { ImageComponent as DefaultImage } from './Image';
import { Card as DefaultCard } from './LinkPreview/Card';
import { FileAttachment as DefaultFile } from './FileAttachment';
import { Giphy as DefaultGiphy } from './Giphy';
import { Geolocation as DefaultGeolocation } from './Geolocation';
import { ModalGallery as DefaultModalGallery } from './ModalGallery';
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
import { useComponentContext } from '../../context/ComponentContext';
import type { ImageAttachmentConfiguration } from '../../types/types';
import { VisibilityDisclaimer } from './VisibilityDisclaimer';
import { AttachmentUploadProgressIndicator as DefaultAttachmentUploadProgressIndicator } from './components';
import {
  getAttachmentPreviewUrl,
  hasPendingUploadState,
} from './hooks/useAttachmentUploadState';
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

/**
 * Whether there is anything to render the attachment from: a CDN url, or the local file while
 * its upload is in flight — or after it failed, since a failed message can be retried and the
 * user has to see what they are retrying.
 *
 * Deliberately non-reactive (payload only): `UploadManager` drops its record a microtask before
 * the resolved URL is written back, and gating on the live record would blink the attachment out
 * of the DOM in between.
 */
const hasRenderableSource = (attachment: Attachment | LocalAttachment) =>
  hasPendingUploadState(attachment) ||
  !!getAttachmentPreviewUrl(attachment, attachment.asset_url);

export const FileContainer = (props: RenderAttachmentProps) => {
  const { attachment } = props;

  // Audio and voice recordings render nothing without a source — `useAudioPlayer` needs one —
  // but their containers would still occupy layout, so they are filtered here too.
  if (isVoiceRecordingAttachment(attachment)) {
    return hasRenderableSource(attachment) ? (
      <VoiceRecordingContainer {...props} />
    ) : null;
  }

  if (isAudioAttachment(attachment)) {
    return hasRenderableSource(attachment) ? <AudioContainer {...props} /> : null;
  }

  if (
    !hasRenderableSource(attachment) ||
    !isFileAttachment(attachment, SUPPORTED_VIDEO_FORMATS)
  ) {
    return null;
  }

  return <OtherFilesContainer {...props} />;
};

export const GalleryContainer = ({
  attachment,
  ModalGallery = DefaultModalGallery,
}: RenderGalleryProps) => {
  const { AttachmentUploadProgressIndicator = DefaultAttachmentUploadProgressIndicator } =
    useComponentContext();
  const items = useMemo<GalleryItem[]>(
    () =>
      attachment.items.reduce<GalleryItem[]>((acc, attachment) => {
        // Falls back to the local blob preview while the upload is still in flight.
        const item = toGalleryItemDescriptors({
          ...attachment,
          image_url: getAttachmentPreviewUrl(attachment, attachment.image_url),
        });
        if (item) acc.push(item);
        return acc;
      }, []),
    [attachment.items],
  );
  return (
    <AttachmentWithinContainer attachment={attachment} componentType='gallery'>
      <ModalGallery items={items} key='gallery' />
      {/* One combined bar for the gallery — per-item overlays are not possible here,
          because ModalGallery receives positioned descriptors, not the attachments. */}
      <AttachmentUploadProgressIndicator
        attachments={attachment.items}
        variant='overlay'
      />
    </AttachmentWithinContainer>
  );
};

export const ImageContainer = (props: RenderAttachmentProps) => {
  const { attachment, Image = DefaultImage } = props;
  const { AttachmentUploadProgressIndicator = DefaultAttachmentUploadProgressIndicator } =
    useComponentContext();
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

  // Falls back to the local blob preview while the upload is still in flight.
  const imgUrlFromAttachment =
    getAttachmentPreviewUrl(attachment, attachment.image_url, attachment.thumb_url) || '';

  const imageConfig: GalleryItem = {
    ...toGalleryItemDescriptors({
      ...attachment,
      image_url: attachmentConfiguration?.url || imgUrlFromAttachment,
    }),
    ref: imageElement,
    style: getCssDimensionsVariables(imgUrlFromAttachment),
  };

  if (attachment.actions && attachment.actions.length) {
    return (
      <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
        <div className='str-chat__attachment'>
          <Image {...imageConfig} />
          <AttachmentUploadProgressIndicator attachment={attachment} variant='overlay' />
          <AttachmentActionsContainer {...props} />
        </div>
      </AttachmentWithinContainer>
    );
  }

  return (
    <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      <Image {...imageConfig} />
      <AttachmentUploadProgressIndicator attachment={attachment} variant='overlay' />
    </AttachmentWithinContainer>
  );
};

export const OtherFilesContainer = ({
  attachment,
  File = DefaultFile,
}: RenderAttachmentProps) => {
  // Same check as FileContainer, repeated because this is exported and used directly too.
  if (!hasRenderableSource(attachment)) return null;

  return (
    <AttachmentWithinContainer attachment={attachment} componentType='file'>
      <File attachment={attachment} />
    </AttachmentWithinContainer>
  );
};

export const AudioContainer = ({
  attachment,
  Audio = DefaultAudioAttachment,
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
  const { AttachmentUploadProgressIndicator = DefaultAttachmentUploadProgressIndicator } =
    useComponentContext();
  const componentType = 'media';

  return attachment.actions?.length ? (
    <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      <div className='str-chat__attachment'>
        <VideoAttachment attachment={attachment} VideoPlayer={Media} />
        <AttachmentUploadProgressIndicator attachment={attachment} variant='overlay' />
        <AttachmentActionsContainer {...props} />
      </div>
    </AttachmentWithinContainer>
  ) : (
    <AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      <VideoAttachment attachment={attachment} VideoPlayer={Media} />
      <AttachmentUploadProgressIndicator attachment={attachment} variant='overlay' />
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
  <AttachmentWithinContainer attachment={attachment} componentType='unsupported'>
    <UnsupportedAttachment attachment={attachment} />
  </AttachmentWithinContainer>
);
