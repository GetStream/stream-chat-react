'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  LocalMessage,
} from 'stream-chat';
import { Chat, useCreateChatClient, useChatContext } from 'stream-chat-react';
import { Sidebar } from '../Sidebar';
import { ChatContainer } from '../ChatContainer';
import { summarizeConversation } from '@/components/api';
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
  const router = useRouter();
  const searchParams = useSearchParams();

  // Update URL when channel changes using Next.js router
  useEffect(() => {
    if (channel?.id) {
      const currentConversationId = searchParams.get('conversation_id');

      // Only push if the conversation_id actually changed
      if (currentConversationId !== channel.id) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('conversation_id', channel.id);
        router.push(`?${params.toString()}`, { scroll: false });
      }
    }
  }, [channel?.id, searchParams, router]);

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

  // Watch for new messages and trigger summarization
  useEffect(() => {
    if (!channel) return;

    const handleNewMessage = async () => {
      try {
        // Get channel state to check message count
        const state = channel.state;
        const messages = state.messages || [];
        const messageCount = messages.length;

        // Only run if there are 5 or fewer messages
        if (messageCount > 5) return;

        // Extract text from the last 5 messages
        const messageTexts = messages
          .slice(-5)
          .map((msg) => msg.text || '')
          .filter((text) => text.trim() !== '')
          .join('\n');

        if (messageTexts.length === 0) return;

        const summary = await summarizeConversation(messageTexts);
        await channel.update({ summary });
      } catch (error) {
        console.error('Failed to summarize conversation:', error);
      }
    };

    const subscription = channel.on('message.new', handleNewMessage);
    return () => {
      subscription.unsubscribe();
    };
  }, [channel]);

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
