import { MessageInput, Thread, VirtualizedMessageList, Window } from 'stream-chat-react';

import { useOverrideSubmit } from '../../hooks/useOverrideSubmit';

export const ChannelInner = () => {
  const overrideSubmitHandler = useOverrideSubmit();

  return (
    <>
      <Window hideOnThread>
        <VirtualizedMessageList hideDeletedMessages separateGiphyPreview />
        <MessageInput focus maxRows={2} grow overrideSubmitHandler={overrideSubmitHandler} />
      </Window>
      <Thread />
    </>
  );
};
