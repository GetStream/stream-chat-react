'use client';

import { useEffect } from 'react';
import {
  Channel,
  MessageComposer,
  MessageList,
  useChatContext,
  WithComponents,
} from 'stream-chat-react';
import { useActiveChannel } from '../ActiveChannelContext';
import { createDraftConversation } from '../createDraftConversation';
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

export const ChatContainer = ({ onToggleSidebar }: ChatContainerProps) => {
  const { client } = useChatContext();
  const { activeChannel: channel, setActiveChannel } = useActiveChannel();

  useEffect(() => {
    if (!channel) {
      setActiveChannel(createDraftConversation(client));
    }
  }, [channel, client, setActiveChannel]);

  return (
    <div className='ai-demo-chat-container'>
      <WithComponents
        overrides={{
          EmptyStateIndicator: EmptyState,
          MessageUI: MessageBubble,
          UnreadMessagesNotification: NoOp,
          UnreadMessagesSeparator: NoOp,
          MessageComposerUI: MessageInputBar,
        }}
      >
        {channel && (
          <Channel channel={channel}>
            <TopNavBar onToggleSidebar={onToggleSidebar} />
            <MessageList />
            <AIStateIndicator />
            <MessageComposer focus />
          </Channel>
        )}
      </WithComponents>
    </div>
  );
};
