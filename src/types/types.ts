import type { PropsWithChildren } from 'react';
import type { LoadingIndicatorProps } from '../components/Loading/LoadingIndicator';
import type { Attachment, ChannelState as StreamChannelState } from 'stream-chat';

export type UnknownType = Record<string, unknown>;
export type PropsWithChildrenOnly = PropsWithChildren<Record<never, never>>;

export type CustomMessageType = 'channel.intro' | 'message.date';

export type PaginatorProps = {
  /** callback to load the next page */
  loadNextPage: () => void;
  /** indicates if there is a next page to load */
  hasNextPage?: boolean;
  /** indicates if there is a previous page to load */
  hasPreviousPage?: boolean;
  /** indicates whether a loading request is in progress */
  isLoading?: boolean;
  /** The loading indicator to use */
  LoadingIndicator?: React.ComponentType<LoadingIndicatorProps>;
  /** callback to load the previous page */
  loadPreviousPage?: () => void;
  /** display the items in opposite order */
  reverse?: boolean;
  /** Offset from when to start the loadNextPage call */
  threshold?: number;
};

export interface IconProps {
  className?: string;
}

export type Dimensions = { height?: string; width?: string };

export type ImageAttachmentConfiguration = {
  url: string;
};

export type VideoAttachmentConfiguration = ImageAttachmentConfiguration & {
  thumbUrl?: string;
};

export type ImageAttachmentSizeHandler = (
  attachment: Attachment,
  element: HTMLElement,
) => ImageAttachmentConfiguration;

export type VideoAttachmentSizeHandler = (
  attachment: Attachment,
  element: HTMLElement,
  shouldGenerateVideoThumbnail: boolean,
) => VideoAttachmentConfiguration;

export type ChannelUnreadUiState = Omit<ValuesType<StreamChannelState['read']>, 'user'>;

export type Readable<T> = {
  [key in keyof T]: T[key];
} & {};

export type ValuesType<T> = T[keyof T];

export type PartialSelected<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K];
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
