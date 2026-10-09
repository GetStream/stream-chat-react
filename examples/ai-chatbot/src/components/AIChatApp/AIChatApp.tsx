'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  ChannelFilters,
  ChannelPaginatorRequestOptions,
  LocalMessage,
  SortParamRequest,
} from 'stream-chat';
import { ChannelPaginator } from 'stream-chat';
import { Chat, getChannel, useChatContext, useCreateChatClient } from 'stream-chat-react';
import { ActiveChannelProvider, useActiveChannel } from '../ActiveChannelContext';
import { Sidebar } from '../Sidebar';
import { ChatContainer } from '../ChatContainer';
import { LoadingScreen } from '../LoadingScreen';
import './AIChatApp.scss';

interface ChannelListQuery {
  filters: ChannelFilters;
  pageSize: number;
  requestOptions: ChannelPaginatorRequestOptions;
  sort: SortParamRequest[];
}

interface AIChatAppProps extends ChannelListQuery {
  apiKey: string;
  userToken: string;
  userId: string;
  initialChannelId?: string;
}

const CHANNEL_LIST_ID = 'ai-chatbot:conversations';

// stream-chat v10 nests custom message fields under `custom`.
const isMessageAIGenerated = (message: LocalMessage) => !!message?.custom?.ai_generated;

/**
 * Registers the sidebar's conversation list on the client's `ChannelManager`, which `ChannelLists`
 * renders and keeps in sync with WebSocket events. The query arrives from the server component as
 * fresh objects on every navigation, so it is keyed by value rather than by reference: a new
 * paginator would reload the list each time the conversation changes.
 */
const useConversationListPaginator = (query: ChannelListQuery) => {
  const { client } = useChatContext();
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    const { filters, pageSize, requestOptions, sort } = JSON.parse(
      queryKey,
    ) as ChannelListQuery;
    const paginator = new ChannelPaginator({
      client,
      filters,
      id: CHANNEL_LIST_ID,
      paginatorOptions: { pageSize },
      requestOptions,
      sort,
    });
    client.channelManager.insertPaginator({ paginator });

    return () => {
      client.channelManager.removePaginator(paginator);
    };
  }, [client, queryKey]);
};

const ChatContent = ({
  initialChannelId,
  ...query
}: ChannelListQuery & { initialChannelId?: string }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { client } = useChatContext();
  const { activeChannel: channel, setActiveChannel } = useActiveChannel();
  const router = useRouter();
  const searchParams = useSearchParams();

  useConversationListPaginator(query);

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

  // Load initial channel from URL on mount. `Channel` no longer queries the channel it is given,
  // so it is watched here first (`getChannel` de-duplicates concurrent watches).
  useEffect(() => {
    if (initialChannelId && client && !channel) {
      const loadChannel = async () => {
        const targetChannel = await getChannel({
          client,
          id: initialChannelId,
          type: 'messaging',
        });
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
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <ChatContainer onToggleSidebar={toggleSidebar} />
    </>
  );
};

export const AIChatApp = ({
  apiKey,
  userToken,
  userId,
  initialChannelId,
  ...query
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
    if (!minTimeElapsed) return;
    setIsFadingOut(true);
    // Remove loading screen after animation completes (400ms)
    const fadeOutTimer = setTimeout(() => {
      setShowLoadingScreen(false);
    }, 400);

    return () => clearTimeout(fadeOutTimer);
  }, [minTimeElapsed]);

  return (
    <div className='ai-demo-app'>
      {chatClient && (
        <Chat client={chatClient} isMessageAIGenerated={isMessageAIGenerated}>
          <ActiveChannelProvider>
            <ChatContent initialChannelId={initialChannelId} {...query} />
          </ActiveChannelProvider>
        </Chat>
      )}
      {showLoadingScreen && <LoadingScreen isFadingOut={isFadingOut} />}
    </div>
  );
};
