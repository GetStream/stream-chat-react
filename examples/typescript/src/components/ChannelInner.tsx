import React from 'react';

import { ChannelHeader, MessageList, MessageInput, Thread, Window } from 'stream-chat-react';

export const ChannelInner = () => {
  return (
    <>
      <Window>
        <ChannelHeader />
        <MessageList />
        <MessageInput focus />
      </Window>
      <Thread />
    </>
  );
};
