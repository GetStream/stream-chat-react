import { useState, useEffect } from 'react';
import type {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  LocalMessage,
} from 'stream-chat';
import { Chat, useCreateChatClient, useChatContext } from 'stream-chat-react';
import { Sidebar } from '../Sidebar';
import { ChatContainer } from '../ChatContainer';
import './AIChatApp.scss';

interface AIChatAppProps {
  apiKey: string;
  userToken: string;
  userId: string;
  filters: ChannelFilters;
  options: ChannelOptions;
  sort: ChannelSort;
  initialChannelId?: string;
}

const isMessageAIGenerated = (message: LocalMessage) => !!message?.ai_generated;

const ChatContent = ({
  filters,
  options,
  sort,
  initialChannelId,
}: {
  filters: ChannelFilters;
  options: ChannelOptions;
  sort: ChannelSort;
  initialChannelId?: string;
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { client, channel, setActiveChannel } = useChatContext();

  // Update URL when channel changes
  useEffect(() => {
    if (channel?.id) {
      const url = new URL(window.location.href);
      const currentConversationId = url.searchParams.get('conversation_id');

      // Only push if the conversation_id actually changed
      if (currentConversationId !== channel.id) {
        url.searchParams.set('conversation_id', channel.id);
        window.history.pushState({}, '', url.toString());
      }
    }
  }, [channel?.id]);

  // Load initial channel from URL on mount
  useEffect(() => {
    if (initialChannelId && client && !channel) {
      const loadChannel = async () => {
        const targetChannel = client.channel('messaging', initialChannelId);
        await targetChannel.watch();
        setActiveChannel(targetChannel);
      };
      loadChannel().catch((err) => {
        console.error('Failed to load channel', err);
      });
    }
  }, [initialChannelId, client, channel, setActiveChannel]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = async () => {
      const url = new URL(window.location.href);
      const conversationId = url.searchParams.get('conversation_id');

      if (conversationId && client && conversationId !== channel?.id) {
        const targetChannel = client.channel('messaging', conversationId);
        await targetChannel.watch();
        setActiveChannel(targetChannel);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [client, channel?.id, setActiveChannel]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <>
      <Sidebar
        filters={filters}
        options={options}
        sort={sort}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />
      <ChatContainer onToggleSidebar={toggleSidebar} />
    </>
  );
};

export const AIChatApp = ({
  apiKey,
  userToken,
  userId,
  filters,
  options,
  sort,
  initialChannelId,
}: AIChatAppProps) => {
  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: { id: userId },
  });

  if (!chatClient) return <>Loading...</>;

  return (
    <div className="ai-demo-app">
      <Chat client={chatClient} isMessageAIGenerated={isMessageAIGenerated}>
        <ChatContent
          filters={filters}
          options={options}
          sort={sort}
          initialChannelId={initialChannelId}
        />
      </Chat>
    </div>
  );
};
