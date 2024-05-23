import { useEffect, useState } from 'react';

import { StreamChat, TokenOrProvider, UserResponse, UserResponseEx } from 'stream-chat';

/**
 * React hook to create, connect and return `StreamChat` client.
 */
export const useCreateChatClient = ({
  apiKey,
  tokenOrProvider,
  userData,
}: {
  apiKey: string;
  tokenOrProvider: TokenOrProvider;
  userData: UserResponseEx;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [cachedUserData, setCachedUserData] = useState(userData);

  if (userData.id !== cachedUserData.id) {
    setCachedUserData(userData);
  }

  useEffect(() => {
    const client = new StreamChat(apiKey);
    let didUserConnectInterrupt = false;

    const connectionPromise = client
      .connectUser(cachedUserData as UserResponse, tokenOrProvider)
      .then(() => {
        if (!didUserConnectInterrupt) setChatClient(client);
      });

    return () => {
      didUserConnectInterrupt = true;
      setChatClient(null);
      connectionPromise
        .then(() => client.disconnectUser())
        .then(() => {
          console.log(`Connection for user "${cachedUserData.id}" has been closed`);
        });
    };
  }, [apiKey, cachedUserData, tokenOrProvider]);

  return chatClient;
};
