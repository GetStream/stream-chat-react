import { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';
import { customAlphabet } from 'nanoid';
import './EmptyState.scss';

const nanoId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

export const EmptyState = () => {
  const { channel, setActiveChannel, client } = useChatContext();

  useEffect(() => {
    if (!channel) {
      setActiveChannel(
        client.channel('messaging', `ai-${nanoId()}`, {
          members: [client.userID as string],
        }),
      );
    }
  }, [channel, client, setActiveChannel]);

  return (
    <div className="ai-demo-empty-state">
      <div className="ai-demo-empty-state__content">
        <h1 className="ai-demo-empty-state__title">Start a conversation</h1>
        <p className="ai-demo-empty-state__subtitle">
          Ask me anything, and I'll do my best to help.
        </p>
      </div>
    </div>
  );
};
