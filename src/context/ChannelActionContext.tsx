import React, { PropsWithChildren, useContext } from 'react';

import type {
  Attachment,
  Message,
  UpdatedMessage,
  UpdateMessageAPIResponse,
  UserResponse,
} from 'stream-chat';

import type { StreamMessage } from './ChannelStateContext';

import type { ChannelStateReducerAction } from '../components/Channel/channelState';
import type { CustomMentionHandler } from '../components/Message/hooks/useMentionsHandler';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../types/types';

export type MessageAttachments<At extends DefaultAttachmentType = DefaultAttachmentType> = Array<
  Attachment<At> & { file_size?: number; mime_type?: string }
>;

export type MessageToSend<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  attachments?: MessageAttachments<At>;
  errorStatusCode?: number;
  id?: string;
  mentioned_users?: UserResponse<Us>[];
  parent?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  parent_id?: string;
  status?: string;
  text?: string;
};

export type RetrySendMessage<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => Promise<void>;

export type ChannelActionContextValue<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  addNotification: (text: string, type: 'success' | 'error') => void;
  closeThread: (event: React.BaseSyntheticEvent) => void;
  dispatch: React.Dispatch<ChannelStateReducerAction<At, Ch, Co, Ev, Me, Re, Us>>;
  editMessage: (
    message: UpdatedMessage<At, Ch, Co, Me, Re, Us>,
  ) => Promise<UpdateMessageAPIResponse<At, Ch, Co, Me, Re, Us> | void>;
  loadMore: (limit?: number) => Promise<number>;
  loadMoreThread: () => Promise<void>;
  onMentionsClick: CustomMentionHandler<Us>;
  onMentionsHover: CustomMentionHandler<Us>;
  openThread: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
    event: React.BaseSyntheticEvent,
  ) => void;
  removeMessage: (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => void;
  retrySendMessage: RetrySendMessage<At, Ch, Co, Ev, Me, Re, Us>;
  sendMessage: (
    message: MessageToSend<At, Ch, Co, Ev, Me, Re, Us>,
    customMessageData?: Partial<Message<At, Me, Us>>,
  ) => Promise<void>;
  setQuotedMessage: React.Dispatch<
    React.SetStateAction<StreamMessage<At, Ch, Co, Ev, Me, Re, Us> | undefined>
  >;
  updateMessage: (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => void;
};

export const ChannelActionContext = React.createContext<ChannelActionContextValue | undefined>(
  undefined,
);

export const ChannelActionProvider = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelActionContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <ChannelActionContext.Provider value={(value as unknown) as ChannelActionContextValue}>
    {children}
  </ChannelActionContext.Provider>
);

export const useChannelActionContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  componentName?: string,
) => {
  const contextValue = useContext(ChannelActionContext);

  if (!contextValue) {
    console.warn(
      `The useChannelActionContext hook was called outside of the ChannelActionContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ChannelActionContextValue<At, Ch, Co, Ev, Me, Re, Us>;
  }

  return (contextValue as unknown) as ChannelActionContextValue<At, Ch, Co, Ev, Me, Re, Us>;
};

/**
 * Typescript currently does not support partial inference, so if ChannelActionContext
 * typing is desired while using the HOC withChannelActionContext, the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChannelActionContext = <
  P extends UnknownType,
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ChannelActionContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithChannelActionContextComponent = (
    props: Omit<P, keyof ChannelActionContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const channelActionContext = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...channelActionContext} />;
  };

  WithChannelActionContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithChannelActionContextComponent;
};
