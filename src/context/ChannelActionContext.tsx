import React, { PropsWithChildren, useContext } from 'react';

import type {
  APIErrorResponse,
  Attachment,
  ErrorFromResponse,
  Message,
  UpdatedMessage,
  UpdateMessageAPIResponse,
  UserResponse,
} from 'stream-chat';

import type { StreamMessage } from './ChannelStateContext';

import type { ChannelStateReducerAction } from '../components/Channel/channelState';
import type { CustomMentionHandler } from '../components/Message/hooks/useMentionsHandler';

import type { DefaultStreamChatGenerics, UnknownType } from '../types/types';

export type MessageAttachments<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Array<Attachment<StreamChatGenerics>>;

export type MessageToSend<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  attachments?: MessageAttachments<StreamChatGenerics>;
  error?: ErrorFromResponse<APIErrorResponse>;
  errorStatusCode?: number;
  id?: string;
  mentioned_users?: UserResponse<StreamChatGenerics>[];
  parent?: StreamMessage<StreamChatGenerics>;
  parent_id?: string;
  status?: string;
  text?: string;
};

export type RetrySendMessage<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = (message: StreamMessage<StreamChatGenerics>) => Promise<void>;

export type ChannelActionContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  addNotification: (text: string, type: 'success' | 'error') => void;
  closeThread: (event?: React.BaseSyntheticEvent) => void;
  dispatch: React.Dispatch<ChannelStateReducerAction<StreamChatGenerics>>;
  editMessage: (
    message: UpdatedMessage<StreamChatGenerics>,
  ) => Promise<UpdateMessageAPIResponse<StreamChatGenerics> | void>;
  jumpToLatestMessage: () => Promise<void>;
  jumpToMessage: (messageId: string, limit?: number) => Promise<void>;
  loadMore: (limit?: number) => Promise<number>;
  loadMoreNewer: (limit?: number) => Promise<number>;
  loadMoreThread: () => Promise<void>;
  onMentionsClick: CustomMentionHandler<StreamChatGenerics>;
  onMentionsHover: CustomMentionHandler<StreamChatGenerics>;
  openThread: (
    message: StreamMessage<StreamChatGenerics>,
    event?: React.BaseSyntheticEvent,
  ) => void;
  removeMessage: (message: StreamMessage<StreamChatGenerics>) => void;
  retrySendMessage: RetrySendMessage<StreamChatGenerics>;
  sendMessage: (
    message: MessageToSend<StreamChatGenerics>,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
  ) => Promise<void>;
  setQuotedMessage: React.Dispatch<
    React.SetStateAction<StreamMessage<StreamChatGenerics> | undefined>
  >;
  updateMessage: (message: StreamMessage<StreamChatGenerics>) => void;
};

export const ChannelActionContext = React.createContext<ChannelActionContextValue | undefined>(
  undefined,
);

export const ChannelActionProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelActionContextValue<StreamChatGenerics>;
}>) => (
  <ChannelActionContext.Provider value={(value as unknown) as ChannelActionContextValue}>
    {children}
  </ChannelActionContext.Provider>
);

export const useChannelActionContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  componentName?: string,
) => {
  const contextValue = useContext(ChannelActionContext);

  if (!contextValue) {
    console.warn(
      `The useChannelActionContext hook was called outside of the ChannelActionContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ChannelActionContextValue<StreamChatGenerics>;
  }

  return (contextValue as unknown) as ChannelActionContextValue<StreamChatGenerics>;
};

/**
 * Typescript currently does not support partial inference, so if ChannelActionContext
 * typing is desired while using the HOC withChannelActionContext, the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChannelActionContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  Component: React.ComponentType<P>,
) => {
  const WithChannelActionContextComponent = (
    props: Omit<P, keyof ChannelActionContextValue<StreamChatGenerics>>,
  ) => {
    const channelActionContext = useChannelActionContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...channelActionContext} />;
  };

  WithChannelActionContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithChannelActionContextComponent;
};
