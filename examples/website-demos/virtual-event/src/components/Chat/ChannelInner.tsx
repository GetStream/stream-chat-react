import { MessageInput, Thread, VirtualizedMessageList, Window } from 'stream-chat-react';

import { MessageUI } from './MessageUI';
import { ThreadInputUI } from './ThreadInputUI';

import { useOverrideSubmit } from '../../hooks/useOverrideSubmit';

export const ChannelInner = () => {
  const overrideSubmitHandler = useOverrideSubmit();

  return (
    <>
      <Window hideOnThread>
        <VirtualizedMessageList hideDeletedMessages />
        <MessageInput focus maxRows={2} grow overrideSubmitHandler={overrideSubmitHandler} />
      </Window>
      <Thread Input={ThreadInputUI} Message={MessageUI} />
    </>
  );
};
