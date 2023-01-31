import { useEffect, useState } from 'react';

import {
  DefaultGenerics,
  ExtendableGenerics,
  OwnUserResponse,
  StreamChat,
  TokenOrProvider,
  UserResponse,
} from 'stream-chat';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeCancellable = <T extends (...functionArguments: any[]) => any>(
  functionToCancel: T,
  delay: number,
) => {
  let timeout: NodeJS.Timeout | null = null;

  const start = (...functionArguments: Parameters<T>) =>
    new Promise<ReturnType<T>>((resolve, reject) => {
      if (timeout) return reject(new Error('"start" has been already called'));
      timeout = setTimeout(() => {
        timeout = null;
        try {
          resolve(functionToCancel(...functionArguments));
        } catch (error) {
          reject(error);
        }
      }, delay);
    });

  const cancel = () => {
    if (timeout === null) return;
    clearTimeout(timeout);
    timeout = null;
  };

  return [cancel, start] as const;
};

/**
 * React hook to create, connect and return `StreamChat` client.
 */
export const useCreateChatClient = <SCG extends ExtendableGenerics = DefaultGenerics>({
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
          console.log(`Connection for user "${userData.id}" has been closed`);
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, userData.id, tokenOrProvider]);

  return chatClient;
};

/**
 * React hook to create, connect and return `StreamChat` client with debounced connector.
 * Delays initial connection by the specified `cancellationTimeout` (defaults to 200 ms).
 * Useful for applications where there's a need to switch users extremely fast without initiating connection.
 */
export const useCancelableCreateChatClient_UNSTABLE = <
  SCG extends ExtendableGenerics = DefaultGenerics
>({
  apiKey,
  cancellationTimeout = 200,
  tokenOrProvider,
  userData,
}: {
  apiKey: string;
  tokenOrProvider: TokenOrProvider;
  userData: OwnUserResponse<SCG> | UserResponse<SCG>;
  cancellationTimeout?: number;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat<SCG> | null>(null);

  useEffect(() => {
    const client = new StreamChat<SCG>(apiKey);

    let didUserConnectInterrupt = false;
    const [cancel, start] = makeCancellable(client.connectUser, cancellationTimeout);
    const connectionPromise = start(userData, tokenOrProvider).then(() => {
      // in case user missed cancelation timeout
      // but the connection has been initiated
      if (!didUserConnectInterrupt) setChatClient(client);
    });

    return () => {
      cancel();
      didUserConnectInterrupt = true;
      setChatClient(null);
      connectionPromise
        .then(() => client.disconnectUser())
        .then(() => {
          console.log(`Connection for user "${userData.id}" has been closed`);
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, userData.id, tokenOrProvider]);

  return chatClient;
};
