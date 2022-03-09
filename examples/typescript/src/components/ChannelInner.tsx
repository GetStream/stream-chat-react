import React from 'react';

import {
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  Window,
  Channel,
} from 'stream-chat-react';

export const ChannelInner = () => {
  return (
    <>
      <Channel>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput focus />
        </Window>
        <Thread />
      </Channel>
    </>
  );
};
