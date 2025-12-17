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
import { LoadingScreen } from '../LoadingScreen';
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
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: { id: userId },
  });

  // Ensure loading screen shows for at least 750ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 750);

    return () => clearTimeout(timer);
  }, []);

  // Handle fade-out when both conditions are met
  useEffect(() => {
    if (chatClient && minTimeElapsed && !isFadingOut) {
      // Start fade-out animation
      setIsFadingOut(true);

      // Remove loading screen after animation completes (400ms)
      const fadeOutTimer = setTimeout(() => {
        setShowLoadingScreen(false);
      }, 400);

      return () => clearTimeout(fadeOutTimer);
    }
  }, [chatClient, minTimeElapsed, isFadingOut]);

  return (
    <div className="ai-demo-app">
      {chatClient && (
        <Chat client={chatClient} isMessageAIGenerated={isMessageAIGenerated}>
          <ChatContent
            filters={filters}
            options={options}
            sort={sort}
            initialChannelId={initialChannelId}
          />
        </Chat>
      )}
      {showLoadingScreen && <LoadingScreen isFadingOut={isFadingOut} />}
    </div>
  );
};
