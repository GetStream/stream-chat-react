import React, { useMemo } from 'react';
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
  MediaContainer,
  UnsupportedAttachmentContainer,
} from './AttachmentContainer';
import { SUPPORTED_VIDEO_FORMATS } from './utils';

import type { ReactPlayerProps } from 'react-player';
import type { SharedLocationResponse, Attachment as StreamAttachment } from 'stream-chat';
import type { AttachmentActionsProps } from './AttachmentActions';
import type { AudioProps } from './Audio';
import type { VoiceRecordingProps } from './VoiceRecording';
import type { CardProps } from './LinkPreview/Card';
import type { FileAttachmentProps } from './FileAttachment';
import type { GalleryProps, ImageProps } from '../Gallery';
import type { UnsupportedAttachmentProps } from './UnsupportedAttachment';
import type { ActionHandlerReturnType } from '../Message/hooks/useActionHandler';
import type { GroupedRenderedAttachment } from './utils';
import type { GeolocationProps } from './Geolocation';

export const ATTACHMENT_GROUPS_ORDER = [
  'media',
  'card',
  'geolocation',
  'file',
  'unsupported',
] as const;

export type AttachmentProps = {
  /** The message attachments to render, see [attachment structure](https://getstream.io/chat/docs/javascript/message_format/?language=javascript) **/
  attachments: (StreamAttachment | SharedLocationResponse)[];
  /**	The handler function to call when an action is performed on an attachment, examples include canceling a \/giphy command or shuffling the results. */
  actionHandler?: ActionHandlerReturnType;
  /** Custom UI component for displaying attachment actions, defaults to and accepts same props as: [AttachmentActions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/AttachmentActions.tsx) */
  AttachmentActions?: React.ComponentType<AttachmentActionsProps>;
  /** Custom UI component for displaying an audio type attachment, defaults to and accepts same props as: [Audio](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Audio.tsx) */
  Audio?: React.ComponentType<AudioProps>;
  /** Custom UI component for displaying a card type attachment, defaults to and accepts same props as: [Card](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Card.tsx) */
  Card?: React.ComponentType<CardProps>;
  /** Custom UI component for displaying a file type attachment, defaults to and accepts same props as: [File](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/FileAttachment.tsx) */
  File?: React.ComponentType<FileAttachmentProps>;
  /** Custom UI component for displaying a gallery of image type attachments, defaults to and accepts same props as: [Gallery](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Gallery.tsx) */
  Gallery?: React.ComponentType<GalleryProps>;
  Geolocation?: React.ComponentType<GeolocationProps>;
  /** Custom UI component for displaying an image type attachment, defaults to and accepts same props as: [Image](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Image.tsx) */
  Image?: React.ComponentType<ImageProps>;
  /** Optional flag to signal that an attachment is a displayed as a part of a quoted message */
  isQuoted?: boolean;
  /** Custom UI component for displaying a media type attachment, defaults to `ReactPlayer` from 'react-player' */
  Media?: React.ComponentType<ReactPlayerProps>;
  /** Custom UI component for displaying unsupported attachment types, defaults to NullComponent */
  UnsupportedAttachment?: React.ComponentType<UnsupportedAttachmentProps>;
  /** Custom UI component for displaying an audio recording attachment, defaults to and accepts same props as: [VoiceRecording](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/VoiceRecording.tsx) */
  VoiceRecording?: React.ComponentType<VoiceRecordingProps>;
};

/**
 * A component used for rendering message attachments.
 */
export const Attachment = (props: AttachmentProps) => {
  const { attachments } = props;

  const groupedAttachments = useMemo(
    () => renderGroupedAttachments(props),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attachments],
  );

  return (
    <div className='str-chat__attachment-list'>
      {ATTACHMENT_GROUPS_ORDER.reduce(
        (acc, groupName) => [...acc, ...groupedAttachments[groupName]],
        [] as React.ReactNode[],
      )}
    </div>
  );
};

const renderGroupedAttachments = ({
  attachments,
  ...rest
}: AttachmentProps): GroupedRenderedAttachment => {
  const mediaAttachments: StreamAttachment[] = [];
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
