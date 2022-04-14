import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Chat } from '../';
import type { Event, StreamChat } from 'stream-chat';

const appKey = import.meta.env.E2E_APP_KEY;
if (!appKey || typeof appKey !== 'string') {
  throw new Error('expected APP_KEY');
}
export const apiKey = appKey;

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

// wait for disconnect to happen since there's only one shared
// client and two separate Chat components using it to prevent crashes
let sharedPromise = Promise.resolve();

export type ConnectedUserProps = PropsWithChildren<{
  token: string;
  userId: string;
  client?: StreamChat;
}>;

export const ConnectedUser = ({ children, client, token, userId }: ConnectedUserProps) => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    sharedPromise.then(() => client?.connectUser({ id: userId }, token));

    const handleConnectionChange = ({ online = false }: Event) => {
      setConnected(online);
    };

    client?.on('connection.changed', handleConnectionChange);

    return () => {
      client?.off('connection.changed', handleConnectionChange);
      sharedPromise = client?.disconnectUser() ?? Promise.resolve();
    };
  }, []);

  if (!connected || !client) {
    return <p>Connecting {userId}...</p>;
  }

  return (
    <>
      <h3>User: {userId}</h3>
      <Chat client={client}>{children}</Chat>
    </>
  );
};
