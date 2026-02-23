import type { PropsWithChildren } from 'react';
import React, { useContext } from 'react';

import type {
  DeleteMessageOptions,
  LocalMessage,
  Message,
  MessageResponse,
  SendMessageOptions,
  UpdateMessageAPIResponse,
  UpdateMessageOptions,
} from 'stream-chat';

import type { ChannelStateReducerAction } from '../components/Channel/channelState';
import type { CustomMentionHandler } from '../components/Message/hooks/useMentionsHandler';

import type { ChannelUnreadUiState } from '../types/types';

export type MarkReadWrapperOptions = {
  /**
   * Signal, whether the `channelUnreadUiState` should be updated.
   * By default, the local state update is prevented when the Channel component is mounted.
   * This is in order to keep the UI indicating the original unread state, when the user opens a channel.
   */
  updateChannelUiUnreadState?: boolean;
};

export type RetrySendMessage = (message: LocalMessage) => Promise<void>;

export type ChannelActionContextValue = {
  addNotification: (text: string, type: 'success' | 'error') => void;
  closeThread: (event?: React.BaseSyntheticEvent) => void;
  deleteMessage: (
    message: LocalMessage,
    options?: DeleteMessageOptions,
  ) => Promise<MessageResponse>;
  dispatch: React.Dispatch<ChannelStateReducerAction>;
  editMessage: (
    message: LocalMessage | MessageResponse,
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
  openThread: (message: LocalMessage, event?: React.BaseSyntheticEvent) => void;
  removeMessage: (message: LocalMessage) => void;
  retrySendMessage: RetrySendMessage;
  sendMessage: (params: {
    localMessage: LocalMessage;
    message: Message;
    options?: SendMessageOptions;
  }) => Promise<void>;
  setChannelUnreadUiState: React.Dispatch<
    React.SetStateAction<ChannelUnreadUiState | undefined>
  >;
  updateMessage: (message: MessageResponse | LocalMessage) => void;
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
