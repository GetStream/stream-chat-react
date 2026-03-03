import React from 'react';
import type { GiphyVersions } from 'stream-chat';
import type {
  ImageAttachmentSizeHandler,
  VideoAttachmentSizeHandler,
} from './Attachment';
import {
  getImageAttachmentConfiguration,
  getVideoAttachmentConfiguration,
} from './attachment-sizing';

export type ImageAttachmentConfiguration = {
  url: string;
};
export type VideoAttachmentConfiguration = ImageAttachmentConfiguration & {
  thumbUrl?: string;
};

export type AttachmentContextValue = {
  giphyVersion: GiphyVersions;
  imageAttachmentSizeHandler: ImageAttachmentSizeHandler;
  shouldGenerateVideoThumbnail: boolean;
  videoAttachmentSizeHandler: VideoAttachmentSizeHandler;
};

export const defaultAttachmentContextValue: AttachmentContextValue = {
  giphyVersion: 'fixed_height',
  imageAttachmentSizeHandler: getImageAttachmentConfiguration,
  shouldGenerateVideoThumbnail: true,
  videoAttachmentSizeHandler: getVideoAttachmentConfiguration,
};

const AttachmentContext = React.createContext<AttachmentContextValue>(
  defaultAttachmentContextValue,
);

export const AttachmentContextProvider = AttachmentContext.Provider;

export const useAttachmentContext = () => React.useContext(AttachmentContext);
