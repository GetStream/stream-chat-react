import type { MessageComposerState } from 'stream-chat';
import { useMessageComposerController, useStateStore } from 'stream-chat-react';

const showReplyInChannelSelector = ({ showReplyInChannel }: MessageComposerState) => ({
  showReplyInChannel,
});

export const AlsoSendInChannel = () => {
  const messageComposer = useMessageComposerController();
  const { showReplyInChannel } = useStateStore(
    messageComposer.state,
    showReplyInChannelSelector,
  );

  if (!messageComposer.threadId) return null;

  return (
    <label className='cookbook-composer__also-send'>
      <input
        checked={showReplyInChannel}
        onChange={() => messageComposer.toggleShowReplyInChannel()}
        type='checkbox'
      />
      Also send in channel
    </label>
  );
};
