import React from 'react';

import {
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  Window,
  useChannelActionContext,
  useChannelStateContext,
} from 'stream-chat-react';

export const ChannelInner = () => {
  const { sendMessage } = useChannelActionContext();

  const { channel } = useChannelStateContext();

  const overrideSubmitHandler = async (message: any, cid: string) => {
    await sendMessage(
      {
        ...message,
        // This will be omitted
      },
      { customField: 'anything' },
    );
  };

  return (
    <>
      <Window>
        <ChannelHeader />
        <MessageList />
        <MessageInput focus overrideSubmitHandler={overrideSubmitHandler} />
      </Window>
      <Thread />
    </>
  );
};
