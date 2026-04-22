'use client';

import { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';
import {
  Channel,
  MessageList,
  Window,
  MessageComposer,
  WithComponents,
} from 'stream-chat-react';
import { customAlphabet } from 'nanoid';
import { EmptyState } from '../EmptyState';
import { MessageBubble } from '../MessageBubble';
import { MessageInputBar } from '../MessageInputBar';
import { AIStateIndicator } from '../AIStateIndicator';
import { TopNavBar } from '../TopNavBar';
import './ChatContainer.scss';

interface ChatContainerProps {
  onToggleSidebar: () => void;
}

const NoOp = () => null;

const nanoId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

export const ChatContainer = ({ onToggleSidebar }: ChatContainerProps) => {
  const { channel, setActiveChannel, client } = useChatContext();
  useEffect(() => {
    if (!channel) {
      setActiveChannel(
        client.channel('messaging', `ai-${nanoId()}`, {
          members: [client.userID as string],
          // @ts-expect-error fix - this is a hack that allows a custom upload function to run
          own_capabilities: ['upload-file'],
        }),
      );
    }
  }, [channel, client, setActiveChannel]);

  return (
    <div className="ai-demo-chat-container">
      <WithComponents
        overrides={{
          EmptyStateIndicator: EmptyState,
          Message: MessageBubble,
          UnreadMessagesNotification: NoOp,
          UnreadMessagesSeparator: NoOp,
          MessageComposerUI: MessageInputBar,
        }}
      >
        <Channel initializeOnMount={false}>
          <TopNavBar onToggleSidebar={onToggleSidebar} />
          <Window>
            <MessageList />
            <AIStateIndicator />
            <MessageComposer focus />
          </Window>
        </Channel>
      </WithComponents>
    </div>
  );
};
