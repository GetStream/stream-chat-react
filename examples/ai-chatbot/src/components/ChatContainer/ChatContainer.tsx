'use client';

import { useEffect } from 'react';
import {
  Channel,
  MessageComposer,
  MessageList,
  useChatContext,
  WithComponents,
} from 'stream-chat-react';
import { customAlphabet } from 'nanoid';
import { useActiveChannel } from '../ActiveChannelContext';
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
  const { client } = useChatContext();
  const { activeChannel: channel, setActiveChannel } = useActiveChannel();

  useEffect(() => {
    if (!channel) {
      const newChannel = client.channel('messaging', `ai-${nanoId()}`, {
        members: [{ user_id: client.userID as string }],
      });
      // Hack: the conversation is created on the server only when its first message is sent, so
      // the composer would see no `upload-file` capability until then. Seeding it locally lets the
      // custom upload function run before that; the server's capabilities replace it on watch.
      newChannel.data = { ...newChannel.data, own_capabilities: ['upload-file'] };
      setActiveChannel(newChannel);
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
