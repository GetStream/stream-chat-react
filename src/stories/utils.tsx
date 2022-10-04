import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Chat } from '../';
import {
  DefaultGenerics,
  ExtendableGenerics,
  OwnUserResponse,
  StreamChat,
  TokenOrProvider,
  UserResponse,
} from 'stream-chat';

const appKey = import.meta.env.E2E_APP_KEY;
if (!appKey || typeof appKey !== 'string') {
  throw new Error('expected APP_KEY');
}
export const streamAPIKey = appKey;

type LocalAttachmentType = Record<string, unknown>;
type LocalChannelType = Record<string, unknown>;
type LocalCommandType = string;
type LocalEventType = Record<string, unknown>;
type LocalMessageType = Record<string, unknown>;
type LocalReactionType = Record<string, unknown>;
type LocalUserType = Record<string, unknown>;

export type StreamChatGenerics = {
  attachmentType: LocalAttachmentType;
  channelType: LocalChannelType;
  commandType: LocalCommandType;
  eventType: LocalEventType;
  messageType: LocalMessageType;
  reactionType: LocalReactionType;
  userType: LocalUserType;
};

export type ConnectedUserProps = PropsWithChildren<{
  token: string;
  userId: string;
}>;

const useClient = <SCG extends ExtendableGenerics = DefaultGenerics>({
  apiKey,
  tokenOrProvider,
  userData,
}: {
  apiKey: string;
  tokenOrProvider: TokenOrProvider;
  userData: OwnUserResponse<SCG> | UserResponse<SCG>;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat<SCG> | null>(null);

  useEffect(() => {
    const client = new StreamChat<SCG>(apiKey);

    let didUserConnectInterrupt = false;
    const connectionPromise = client.connectUser(userData, tokenOrProvider).then(() => {
      if (!didUserConnectInterrupt) setChatClient(client);
    });

    return () => {
      didUserConnectInterrupt = true;
      setChatClient(null);
      connectionPromise
        .then(() => client.disconnectUser())
        .then(() => {
          console.log('connection closed');
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, userData.id, tokenOrProvider]);

  return chatClient;
};

export const ConnectedUser = <SCG extends DefaultGenerics = StreamChatGenerics>({
  children,
  token,
  userId,
}: ConnectedUserProps) => {
  const client = useClient<SCG>({
    apiKey: streamAPIKey,
    tokenOrProvider: token,
    userData: { id: userId },
  });

  if (!client) return <p>Waiting for connection to be established with user: {userId}...</p>;

  return (
    <>
      <h3>User: {userId}</h3>
      <div className='chat-wrapper'>
        <Chat client={client}>{children}</Chat>
      </div>
    </>
  );
};
