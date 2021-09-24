import { MessageInput, VirtualizedMessageList, Window } from 'stream-chat-react';

import { ThreadInner } from './ThreadInner';

import { useOverrideSubmit } from '../../hooks/useOverrideSubmit';

export const ChannelInner = () => {
  const overrideSubmitHandler = useOverrideSubmit();

  return (
    <>
      <Window hideOnThread>
        <VirtualizedMessageList
          additionalVirtuosoProps={{ alignToBottom: true }}
          hideDeletedMessages
          separateGiphyPreview
        />
        <MessageInput focus maxRows={2} grow overrideSubmitHandler={overrideSubmitHandler} />
      </Window>
      <ThreadInner />
    </>
  );
};
