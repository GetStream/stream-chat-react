import React, { useMemo } from 'react';
import type {
  GiphyVersions,
  SharedLocationResponse,
  Attachment as StreamAttachment,
} from 'stream-chat';
import {
  isAudioAttachment,
  isFileAttachment,
  isImageAttachment,
  isScrapedContent,
  isSharedLocationResponse,
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
import type { GalleryItem } from '../Gallery';
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
} from './AttachmentContext';

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
  /** The message attachments to render, see [attachment structure](https://getstream.io/chat/docs/javascript/message_format/?language=javascript) **/
  attachments: (StreamAttachment | SharedLocationResponse)[];
  /**	The handler function to call when an action is performed on an attachment, examples include canceling a \/giphy command or shuffling the results. */
  actionHandler?: ActionHandlerReturnType;
  /**
   * Which attachment action button receives focus on initial render, keyed by attachment type.
   * Values must match an action's `value` (e.g. `'send'`, `'cancel'`, `'shuffle'` for giphy attachment).
   * Default: `{ giphy: 'send' }`.
   * To disable auto-focus (e.g. when rendering the Giphy preview above the composer so focus
   * stays in the message input), pass an empty object: `attachmentActionsDefaultFocus={{}}`.
   */
  attachmentActionsDefaultFocus?: AttachmentActionsDefaultFocusByType;
  /** Custom UI component for displaying attachment actions, defaults to and accepts same props as: [AttachmentActions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/AttachmentActions.tsx) */
  AttachmentActions?: React.ComponentType<AttachmentActionsProps>;
  /** Custom UI component for displaying an audio type attachment, defaults to and accepts same props as: [Audio](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Audio.tsx) */
  Audio?: React.ComponentType<AudioProps>;
  /** Custom UI component for displaying a card type attachment, defaults to and accepts same props as: [Card](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Card.tsx) */
  Card?: React.ComponentType<CardProps>;
  /** Custom UI component for displaying a file type attachment, defaults to and accepts same props as: [File](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/FileAttachment.tsx) */
  File?: React.ComponentType<FileAttachmentProps>;
  /** Custom UI component for displaying a gallery of image type attachments, defaults to and accepts same props as: [ModalGallery](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/ModalGallery.tsx) */
  ModalGallery?: React.ComponentType<ModalGalleryProps>;
  Geolocation?: React.ComponentType<GeolocationProps>;
  /** Custom UI component for displaying a Giphy image, defaults to and accepts same props as: [Giphy](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Giphy.tsx) */
  Giphy?: React.ComponentType<GiphyAttachmentProps>;
  /** Custom UI component for displaying an image type attachment, defaults to and accepts same props as: [Image](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Image.tsx) */
  Image?: React.ComponentType<ImageProps>;
  /** Giphy rendition to use when rendering giphy attachments */
  giphyVersion?: GiphyVersions;
  /** Handler used to size image attachments responsively */
  imageAttachmentSizeHandler?: ImageAttachmentSizeHandler;
  /** Optional flag to signal that an attachment is a displayed as a part of a quoted message */
  isQuoted?: boolean;
  /** Custom UI component for displaying a media type attachment, defaults to `ReactPlayer` from 'react-player' */
  Media?: React.ComponentType<VideoPlayerProps>;
  /** Whether a video thumbnail should be rendered before playback starts */
  shouldGenerateVideoThumbnail?: boolean;
  /** Custom UI component for displaying unsupported attachment types, defaults to NullComponent */
  UnsupportedAttachment?: React.ComponentType<UnsupportedAttachmentProps>;
  /** Handler used to size video attachments responsively */
  videoAttachmentSizeHandler?: VideoAttachmentSizeHandler;
  /** Custom UI component for displaying an audio recording attachment, defaults to and accepts same props as: [VoiceRecording](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/VoiceRecording.tsx) */
  VoiceRecording?: React.ComponentType<VoiceRecordingProps>;
};

/**
 * A component used for rendering message attachments.
 */
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
  const mediaAttachments: GalleryItem[] = [];
  const containers = attachments.reduce<GroupedRenderedAttachment>(
    (typeMap, attachment) => {
      if (isSharedLocationResponse(attachment)) {
        typeMap.geolocation.push(
          <GeolocationContainer
            {...rest}
            key={`geolocation-${typeMap.geolocation.length}`}
            location={attachment}
          />,
        );
      } else if (attachment.type === 'giphy') {
        typeMap.card.push(
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
        mediaAttachments.push(attachment as GalleryItem);
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
