import type { PropsWithChildren } from 'react';
import type { LoadingIndicatorProps } from '../components/Loading/LoadingIndicator';
import type {
  APIErrorResponse,
  Attachment,
  ErrorFromResponse,
  Event,
  ExtendableGenerics,
  LiteralStringForUnion,
  Mute,
} from 'stream-chat';

export type UnknownType = Record<string, unknown>;
export type PropsWithChildrenOnly = PropsWithChildren<Record<never, never>>;

export type CustomTrigger = {
  [key: string]: {
    componentProps: UnknownType;
    data: UnknownType;
  };
};

export type CustomMessageType = 'channel.intro' | 'message.date';

export type DefaultAttachmentType = UnknownType & {
  asset_url?: string;
  file_size?: number;
  id?: string;
  images?: Array<{
    image_url?: string;
    thumb_url?: string;
  }>;
};

export type DefaultChannelType = UnknownType & {
  frozen?: boolean;
  image?: string;
  member_count?: number;
  subtitle?: string;
};

export type DefaultStreamChatGenerics = ExtendableGenerics & {
  attachmentType: DefaultAttachmentType;
  channelType: DefaultChannelType;
  commandType: LiteralStringForUnion;
  eventType: UnknownType;
  messageType: DefaultMessageType;
  reactionType: UnknownType;
  userType: DefaultUserType;
};

export type DefaultMessageType<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = UnknownType & {
  customType?: CustomMessageType;
  date?: string | Date;
  error?: ErrorFromResponse<APIErrorResponse>;
  errorStatusCode?: number;
  event?: Event<StreamChatGenerics>;
  unread?: boolean;
};

export type DefaultUserTypeInternal = {
  image?: string;
  status?: string;
};

export type DefaultUserType<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = UnknownType &
  DefaultUserTypeInternal & {
    mutes?: Array<Mute<StreamChatGenerics>>;
  };

export type GiphyVersions =
  | 'original'
  | 'fixed_height'
  | 'fixed_height_still'
  | 'fixed_height_downsampled'
  | 'fixed_width'
  | 'fixed_width_still'
  | 'fixed_width_downsampled';

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
  /**
   * @desc indicates if there's currently any refreshing taking place
   * @deprecated Use loading prop instead of refreshing. Planned for removal: https://github.com/GetStream/stream-chat-react/issues/1804
   */
  refreshing?: boolean;
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
