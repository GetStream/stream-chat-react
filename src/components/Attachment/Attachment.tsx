import React, { useMemo } from 'react';
import type {
  GiphyVersions,
  SharedLocationResponseData,
  Attachment as StreamAttachment,
} from 'stream-chat';
import {
  isAudioAttachment,
  isFileAttachment,
  isImageAttachment,
  isScrapedContent,
  isSharedLocationResponseData,
  isVideoAttachment,
  isVoiceRecordingAttachment,
} from 'stream-chat';

import {
  CardContainer,
  FileContainer,
  GeolocationContainer,
  GiphyContainer,
  MediaContainer,
  UnsupportedAttachmentContainer,
} from './AttachmentContainer';
import type { GroupedRenderedAttachment } from './utils';
import { SUPPORTED_VIDEO_FORMATS } from './utils';
import type {
  AttachmentActionsDefaultFocusByType,
  AttachmentActionsProps,
} from './AttachmentActions';
import { defaultAttachmentActionsDefaultFocus } from './AttachmentActions';
import type { AudioProps } from './Audio';
import type { VoiceRecordingProps } from './VoiceRecording';
import type { CardProps } from './LinkPreview/Card';
import type { FileAttachmentProps } from './FileAttachment';
import type { UnsupportedAttachmentProps } from './UnsupportedAttachment';
import type { ActionHandlerReturnType } from '../Message/hooks/useActionHandler';
import type { GeolocationProps } from './Geolocation';
import type { GiphyAttachmentProps } from './Giphy';
import type { VideoPlayerProps } from '../VideoPlayer';
import type { ModalGalleryProps } from './ModalGallery';
import type { ImageProps } from './Image';
import {
  AttachmentContextProvider,
  defaultAttachmentContextValue,
  type ImageAttachmentConfiguration,
  type VideoAttachmentConfiguration,
} from '../../context/AttachmentContext';

export const ATTACHMENT_GROUPS_ORDER = [
  'media',
  'giphy',
  'card',
  'geolocation',
  'file',
  'unsupported',
] as const;

export type ImageAttachmentSizeHandler = (
  attachment: StreamAttachment,
  element: HTMLElement,
) => ImageAttachmentConfiguration;

export type VideoAttachmentSizeHandler = (
  attachment: StreamAttachment,
  element: HTMLElement,
  shouldGenerateVideoThumbnail: boolean,
) => VideoAttachmentConfiguration;

export type AttachmentProps = {
  /** Attachments to render. See [attachment structure](https://getstream.io/chat/docs/javascript/message_format/?language=javascript). */
  attachments: (StreamAttachment | SharedLocationResponseData)[];
  /** Called when an attachment action is performed, e.g. sending or shuffling a giphy preview. */
  actionHandler?: ActionHandlerReturnType;
  /**
   * Which action button gets initial focus, keyed by attachment type. Values match an action's
   * `value` (e.g. `'send'`, `'cancel'`, `'shuffle'` for giphy). Defaults to `{ giphy: 'send' }`.
   * Pass an empty object to disable auto-focus, e.g. when the Giphy preview sits above the
   * composer and focus should stay in the message input.
   */
  attachmentActionsDefaultFocus?: AttachmentActionsDefaultFocusByType;
  /** Custom attachment actions UI. Defaults to `AttachmentActions`. */
  AttachmentActions?: React.ComponentType<AttachmentActionsProps>;
  /** Custom UI for audio attachments. Defaults to `Audio`. */
  Audio?: React.ComponentType<AudioProps>;
  /** Custom UI for card attachments. Defaults to `Card`. */
  Card?: React.ComponentType<CardProps>;
  /** Custom UI for file attachments. Defaults to `FileAttachment`. */
  File?: React.ComponentType<FileAttachmentProps>;
  /** Custom UI for the gallery of image attachments. Defaults to `ModalGallery`. */
  ModalGallery?: React.ComponentType<ModalGalleryProps>;
  Geolocation?: React.ComponentType<GeolocationProps>;
  /** Custom UI for Giphy attachments. Defaults to `Giphy`. */
  Giphy?: React.ComponentType<GiphyAttachmentProps>;
  /** Custom UI for image attachments. Defaults to `ImageComponent`. */
  Image?: React.ComponentType<ImageProps>;
  /** Giphy rendition to render. Defaults to `'fixed_height'`. */
  giphyVersion?: GiphyVersions;
  /** Computes the responsive size configuration of an image attachment. */
  imageAttachmentSizeHandler?: ImageAttachmentSizeHandler;
  /** Whether the attachments belong to a quoted message. */
  isQuoted?: boolean;
  /** Custom UI for video attachments. Defaults to `VideoPlayer`. */
  Media?: React.ComponentType<VideoPlayerProps>;
  /** Whether videos show their thumbnail before playback starts. Defaults to true. */
  shouldGenerateVideoThumbnail?: boolean;
  /** Custom UI for unsupported attachment types. Defaults to `UnsupportedAttachment`. */
  UnsupportedAttachment?: React.ComponentType<UnsupportedAttachmentProps>;
  /** Computes the responsive size configuration of a video attachment. */
  videoAttachmentSizeHandler?: VideoAttachmentSizeHandler;
  /** Custom UI for voice recording attachments. Defaults to `VoiceRecording`. */
  VoiceRecording?: React.ComponentType<VoiceRecordingProps>;
};

/** Renders message attachments grouped by type. */
export const Attachment = (props: AttachmentProps) => {
  const {
    attachmentActionsDefaultFocus = defaultAttachmentActionsDefaultFocus,
    attachments,
    giphyVersion,
    imageAttachmentSizeHandler,
    shouldGenerateVideoThumbnail,
    videoAttachmentSizeHandler,
    ...rest
  } = props;
  const attachmentContextValue = useMemo(
    () => ({
      giphyVersion: giphyVersion ?? defaultAttachmentContextValue.giphyVersion,
      imageAttachmentSizeHandler:
        imageAttachmentSizeHandler ??
        defaultAttachmentContextValue.imageAttachmentSizeHandler,
      shouldGenerateVideoThumbnail:
        shouldGenerateVideoThumbnail ??
        defaultAttachmentContextValue.shouldGenerateVideoThumbnail,
      videoAttachmentSizeHandler:
        videoAttachmentSizeHandler ??
        defaultAttachmentContextValue.videoAttachmentSizeHandler,
    }),
    [
      giphyVersion,
      imageAttachmentSizeHandler,
      shouldGenerateVideoThumbnail,
      videoAttachmentSizeHandler,
    ],
  );

  const groupedAttachments = useMemo(
    () =>
      renderGroupedAttachments({
        attachmentActionsDefaultFocus,
        attachments,
        ...rest,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attachments, attachmentActionsDefaultFocus],
  );

  return (
    <AttachmentContextProvider value={attachmentContextValue}>
      <div className='str-chat__attachment-list'>
        {ATTACHMENT_GROUPS_ORDER.reduce(
          (acc, groupName) => [...acc, ...groupedAttachments[groupName]],
          [] as React.ReactNode[],
        )}
      </div>
    </AttachmentContextProvider>
  );
};

const renderGroupedAttachments = ({
  attachments,
  ...rest
}: AttachmentProps): GroupedRenderedAttachment => {
  const mediaAttachments: StreamAttachment[] = [];
  const containers = attachments.reduce<GroupedRenderedAttachment>(
    (typeMap, attachment) => {
      if (isSharedLocationResponseData(attachment)) {
        typeMap.geolocation.push(
          <GeolocationContainer
            {...rest}
            key={`geolocation-${typeMap.geolocation.length}`}
            location={attachment}
          />,
        );
      } else if (attachment.type === 'giphy') {
        typeMap.giphy.push(
          <GiphyContainer
            key={`giphy-${typeMap.giphy.length}`}
            {...rest}
            attachment={attachment}
          />,
        );
      } else if (isScrapedContent(attachment)) {
        typeMap.card.push(
          <CardContainer
            key={`card-${typeMap.card.length}`}
            {...rest}
            attachment={attachment}
          />,
        );
      } else if (
        isImageAttachment(attachment) ||
        isVideoAttachment(attachment, SUPPORTED_VIDEO_FORMATS)
      ) {
        mediaAttachments.push(attachment);
      } else if (
        isAudioAttachment(attachment) ||
        isVoiceRecordingAttachment(attachment) ||
        isFileAttachment(attachment, SUPPORTED_VIDEO_FORMATS)
      ) {
        typeMap.file.push(
          <FileContainer
            key={`file-${typeMap.file.length}`}
            {...rest}
            attachment={attachment}
          />,
        );
      } else {
        typeMap.unsupported.push(
          <UnsupportedAttachmentContainer
            key={`unsupported-${typeMap.unsupported.length}`}
            {...rest}
            attachment={attachment}
          />,
        );
      }

      return typeMap;
    },
    {
      card: [],
      file: [],
      geolocation: [],
      giphy: [],
      media: [],
      unsupported: [],
    },
  );

  if (mediaAttachments.length) {
    containers.media.push(
      <MediaContainer key='media-container' {...rest} attachments={mediaAttachments} />,
    );
  }

  return containers;
};
