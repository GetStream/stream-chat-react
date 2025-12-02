import { Channel, MessageList, Window, MessageInput } from 'stream-chat-react';
import { EmptyState } from '../EmptyState';
import { MessageBubble } from '../MessageBubble';
import { MessageInputBar } from '../MessageInputBar';
import { AIStateIndicator } from '../AIStateIndicator';
import { TopNavBar } from '../TopNavBar';
import './ChatContainer.scss';

interface ChatContainerProps {
  onToggleSidebar: () => void;
}

export const ChatContainer = ({ onToggleSidebar }: ChatContainerProps) => {
  return (
    <div className="ai-demo-chat-container">
      <Channel
        initializeOnMount={false}
        EmptyPlaceholder={<EmptyState />}
        Message={MessageBubble}
        UnreadMessagesNotification={null}
        UnreadMessagesSeparator={null}
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
