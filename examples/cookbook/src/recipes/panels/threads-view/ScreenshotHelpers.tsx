import { useEffect } from 'react';
import { nowNs } from 'stream-chat';
import { useChatContext } from 'stream-chat-react';
import demoData from './demo-data.json';

// The threads the seed keeps unread for the user (`unreadForCurrentUser` in demo-data.json).
const SEEDED_UNREAD_THREAD_IDS = demoData.channels.flatMap(({ messages }) =>
  messages
    .filter(
      (message) => 'unreadForCurrentUser' in message && message.unreadForCurrentUser,
    )
    .map(({ id }) => id),
);

/**
 * For the screenshots only, not part of the recipe. Opening a thread marks it read on the server,
 * which would clear the seeded "unread" state of the threads above for every later visitor. For
 * those threads, a thread `markReadRequest` handler marks the thread read on this device only, so
 * the row and the thread behave as they would and the server keeps the thread unread. Every other
 * thread is marked read as usual.
 */
export const MarkDemoThreadsReadLocally = () => {
  const { client } = useChatContext();

  useEffect(() => {
    client.config.set({
      thread: {
        requestHandlers: {
          markReadRequest: async ({ options, thread }) => {
            if (!SEEDED_UNREAD_THREAD_IDS.includes(thread.id)) {
              return await thread.channel.markRead(options);
            }
            const userId = client.userId;
            thread.state.next((current) => {
              const ownRead = userId ? current.read[userId] : undefined;
              if (!userId || !ownRead) return current;
              return {
                ...current,
                read: {
                  ...current.read,
                  [userId]: { ...ownRead, lastReadAt: nowNs(), unreadMessageCount: 0 },
                },
              };
            });
            return null;
          },
        },
      },
    });
    return () => {
      client.config.set({ thread: { requestHandlers: { markReadRequest: undefined } } });
    };
  }, [client]);

  return null;
};
