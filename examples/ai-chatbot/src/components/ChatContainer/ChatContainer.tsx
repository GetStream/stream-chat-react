'use client';

import { useEffect } from 'react';
import type { DateSeparatorProps } from 'stream-chat-react';
import { useChatContext } from 'stream-chat-react';
import {
  Channel,
  MessageList,
  Window,
  MessageInput,
  DateSeparator,
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

const CustomDateSeparator = (props: DateSeparatorProps) => (
  <DateSeparator {...props} position="center" />
);

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
      <Channel
        initializeOnMount={false}
        // EmptyPlaceholder={<EmptyState />}
        EmptyStateIndicator={EmptyState}
        DateSeparator={CustomDateSeparator}
        Message={MessageBubble}
        UnreadMessagesNotification={NoOp}
        UnreadMessagesSeparator={NoOp}
      >
        <TopNavBar onToggleSidebar={onToggleSidebar} />
        <Window>
          <MessageList />
          <AIStateIndicator />
          <MessageInput Input={MessageInputBar} focus />
        </Window>
      </Channel>
    </div>
  );
};
