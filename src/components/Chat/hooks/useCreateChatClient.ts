import { useEffect, useState } from 'react';

import { StreamChat } from 'stream-chat';

import type {
  ClientUser,
  DeepPartial,
  InstanceConfigTree,
  TokenOrProvider,
} from 'stream-chat';

/**
 * Creates a `StreamChat` client and connects the user. Unmounting disconnects it; a change of
 * `apiKey`, `tokenOrProvider` or `userData.id` disconnects it and creates a new client.
 *
 * @param params.apiKey - Stream API key.
 * @param params.config - Client configuration, the tree `client.config.set()` takes. Read only on
 * the first render.
 * @param params.tokenOrProvider - Token or token provider of the user. Compared by reference, so
 * keep it stable across renders.
 * @param params.userData - User to connect. Changes other than `userData.id` are ignored.
 * @returns The client once the user is connected, null before that.
 */
export const useCreateChatClient = ({
  apiKey,
  config,
  tokenOrProvider,
  userData,
}: {
  apiKey: string;
  tokenOrProvider: TokenOrProvider;
  userData: ClientUser;
  config?: DeepPartial<InstanceConfigTree>;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [cachedUserData, setCachedUserData] = useState(userData);

  if (userData.id !== cachedUserData.id) {
    setCachedUserData(userData);
  }

  const [cachedConfig] = useState(config);

  useEffect(() => {
    const client = new StreamChat(apiKey, cachedConfig);
    let didUserConnectInterrupt = false;

    const connectionPromise = client
      .connectUser(cachedUserData, tokenOrProvider)
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
  }, [apiKey, cachedUserData, cachedConfig, tokenOrProvider]);

  return chatClient;
};
