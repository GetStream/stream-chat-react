import React, { useState } from 'react';

import {
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  Window,
  Channel,
} from 'stream-chat-react';

export const ChannelInner = () => {
  const [shouldMarkRead, setShouldMarkRead] = useState(1);
  console.log('shouldMarkRead value not in customHandler', shouldMarkRead);

  const customHandler = (channel: any) => {
    console.log('closure - shouldMarkRead value in customHandler closure', shouldMarkRead);
    shouldMarkRead && channel.markRead();
  };

  return (
    <>
      <Channel doMarkReadRequest={customHandler}>
      {/* <Channel> */}
        <Window>
          <ChannelHeader />
          <MessageList />
          <button onClick={() => setShouldMarkRead(shouldMarkRead + 1)}>click</button>
          <MessageInput focus />
        </Window>
        <Thread />
      </Channel>
    </>
  );
};
