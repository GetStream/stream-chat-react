import React, { useState } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelList,
  ChannelPreviewMessenger,
  // InfiniteScrollPaginator,
  MessageList,
  MessageInput,
  MessageSimple,
  Window,
  Thread,
} from 'stream-chat-react';

import 'stream-chat-react/dist/css/index.css';
import './App.css';

import {
  CreateChannel,
  MessagingInput,
  MessagingChannelHeader,
  MessagingChannelList,
} from './components';
import { EmptyStateMessage } from './components/EmptyStateMessage/EmptyStateMessage';

const urlParams = new URLSearchParams(window.location.search);
const apiKey = urlParams.get('apikey') || 'qk4nn7rpcn75';
const user = urlParams.get('user') || 'example-user';
const theme = urlParams.get('theme') || 'dark';
const userToken =
  urlParams.get('user_token') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZXhhbXBsZS11c2VyIn0.HlC0dMKL43y3K_XbfvQS_Yc3V314HU4Z7LrBLil777g';

const filters = { type: 'messaging', members: { $in: [user] } };
const sort = {
  last_message_at: -1,
  updated_at: -1,
  cid: 1,
};
const options = { state: true, watch: true, presence: true, limit: 10 };

const App = () => {
  const [isCreating, setIsCreating] = useState(false);

  const chatClient = new StreamChat(apiKey);
  chatClient.setUser({ id: user }, userToken);

  return (
    <Chat client={chatClient} theme={`messaging ${theme}`}>
      <ChannelList
        filters={filters}
        sort={sort}
        options={options}
        List={(props) => (
          <MessagingChannelList
            {...props}
            onCreateChannel={() => setIsCreating(true)}
          />
        )}
        Preview={ChannelPreviewMessenger}
        // Paginator={(props) => (
        //   <InfiniteScrollPaginator threshold={10} {...props} />
        // )}
      />
      <Channel maxNumberOfFiles={10} multipleUploads={true}>
        <CreateChannel
          onClose={() => setIsCreating(false)}
          visible={isCreating}
        />
        <Window>
          <MessagingChannelHeader />
          <MessageList
            TypingIndicator={() => null}
            EmptyStateIndicator={() => <EmptyStateMessage />}
          />
          <MessageInput focus Input={MessagingInput} />
        </Window>
        <Thread
          Message={MessageSimple}
          additionalMessageInputProps={{
            Input: MessagingInput,
          }}
        />
      </Channel>
    </Chat>
  );
};

export default App;
