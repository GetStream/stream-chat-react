import { useEffect, useState } from 'react';

import { StreamChat } from 'stream-chat';

import type {
  ClientUser,
  DeepPartial,
  InstanceConfigTree,
  TokenOrProvider,
} from 'stream-chat';

/**
 * React hook to create, connect and return `StreamChat` client.
 *
 * `config` is the declarative configuration the client is constructed with — the same tree
 * `client.config.set()` takes, e.g. `{ client: { baseURL, axiosRequestConfig } }`. It is read once, on
 * the first render.
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
