import type { PropsWithChildren } from 'react';
import React, { useContext } from 'react';

import type {
  APIErrorResponse,
  Attachment,
  ErrorFromResponse,
  Message,
  MessageResponse,
  SendMessageOptions,
  UpdatedMessage,
  UpdateMessageAPIResponse,
  UserResponse,
} from 'stream-chat';

import type { StreamMessage } from './ChannelStateContext';

import type { ChannelStateReducerAction } from '../components/Channel/channelState';
import type { CustomMentionHandler } from '../components/Message/hooks/useMentionsHandler';

import type {
  ChannelUnreadUiState,
  UnknownType,
  UpdateMessageOptions,
} from '../types/types';

export type MarkReadWrapperOptions = {
  /**
   * Signal, whether the `channelUnreadUiState` should be updated.
   * By default, the local state update is prevented when the Channel component is mounted.
   * This is in order to keep the UI indicating the original unread state, when the user opens a channel.
   */
  updateChannelUiUnreadState?: boolean;
};

export type MessageAttachments = Array<Attachment>;

export type MessageToSend = {
  attachments?: MessageAttachments;
  error?: ErrorFromResponse<APIErrorResponse>;
  errorStatusCode?: number;
  id?: string;
  mentioned_users?: UserResponse[];
  parent?: StreamMessage;
  parent_id?: string;
  status?: string;
  text?: string;
};

export type RetrySendMessage = (message: StreamMessage) => Promise<void>;

export type ChannelActionContextValue = {
  addNotification: (text: string, type: 'success' | 'error') => void;
  closeThread: (event?: React.BaseSyntheticEvent) => void;
  deleteMessage: (message: StreamMessage) => Promise<MessageResponse>;
  dispatch: React.Dispatch<ChannelStateReducerAction>;
  editMessage: (
    message: UpdatedMessage,
    options?: UpdateMessageOptions,
  ) => Promise<UpdateMessageAPIResponse | void>;
  jumpToFirstUnreadMessage: (
    queryMessageLimit?: number,
    highlightDuration?: number,
  ) => Promise<void>;
  jumpToLatestMessage: () => Promise<void>;
  jumpToMessage: (
    messageId: string,
    limit?: number,
    highlightDuration?: number,
  ) => Promise<void>;
  loadMore: (limit?: number) => Promise<number>;
  loadMoreNewer: (limit?: number) => Promise<number>;
  loadMoreThread: () => Promise<void>;
  markRead: (options?: MarkReadWrapperOptions) => void;
  onMentionsClick: CustomMentionHandler;
  onMentionsHover: CustomMentionHandler;
  openThread: (message: StreamMessage, event?: React.BaseSyntheticEvent) => void;
  removeMessage: (message: StreamMessage) => void;
  retrySendMessage: RetrySendMessage;
  sendMessage: (
    message: MessageToSend,
    customMessageData?: Partial<Message>,
    options?: SendMessageOptions,
  ) => Promise<void>;
  setChannelUnreadUiState: React.Dispatch<
    React.SetStateAction<ChannelUnreadUiState | undefined>
  >;
  updateMessage: (message: StreamMessage) => void;
};

export const ChannelActionContext = React.createContext<
  ChannelActionContextValue | undefined
>(undefined);

export const ChannelActionProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelActionContextValue;
}>) => (
  <ChannelActionContext.Provider value={value as unknown as ChannelActionContextValue}>
    {children}
  </ChannelActionContext.Provider>
);

export const useChannelActionContext = (componentName?: string) => {
  const contextValue = useContext(ChannelActionContext);

  if (!contextValue) {
    console.warn(
      `The useChannelActionContext hook was called outside of the ChannelActionContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ChannelActionContextValue;
  }

  return contextValue as unknown as ChannelActionContextValue;
};

/**
 * Typescript currently does not support partial inference, so if ChannelActionContext
 * typing is desired while using the HOC withChannelActionContext, the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChannelActionContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
) => {
  const WithChannelActionContextComponent = (
    props: Omit<P, keyof ChannelActionContextValue>,
  ) => {
    const channelActionContext = useChannelActionContext();

    return <Component {...(props as P)} {...channelActionContext} />;
  };

  WithChannelActionContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithChannelActionContextComponent;
};
