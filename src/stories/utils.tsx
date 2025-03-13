import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import type { PropsWithChildren } from 'react';
import type { OwnUserResponse, TokenOrProvider, UserResponse } from 'stream-chat';

import { Chat } from '../';

const appKey = import.meta.env.E2E_APP_KEY;
if (!appKey || typeof appKey !== 'string') {
  throw new Error('expected APP_KEY');
}
export const streamAPIKey = appKey;

export type ConnectedUserProps = PropsWithChildren<{
  token: string;
  userId: string;
}>;

const useClient = ({
  apiKey,
  tokenOrProvider,
  userData,
}: {
  apiKey: string;
  tokenOrProvider: TokenOrProvider;
  userData: OwnUserResponse | UserResponse;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    const client = new StreamChat(apiKey);

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

export const ConnectedUser = ({ children, token, userId }: ConnectedUserProps) => {
  const client = useClient({
    apiKey: streamAPIKey,
    tokenOrProvider: token,
    userData: { id: userId },
  });

  if (!client)
    return <p>Waiting for connection to be established with user: {userId}...</p>;

  return (
    <>
      <h3>User: {userId}</h3>
      <div className='chat-wrapper'>
        <Chat client={client}>{children}</Chat>
      </div>
    </>
  );
};
