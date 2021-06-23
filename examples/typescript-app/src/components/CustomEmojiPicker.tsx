import React from 'react';
import {
  useChannelStateContext,
  useComponentContext,
  useMessageInputContext,
} from 'stream-chat-react';

import './CustomEmojiPicker.css';

export const CustomEmojiPicker = () => {
  const { emojiConfig } = useChannelStateContext();
  const { emojiData: fullEmojiData } = emojiConfig || {};

  const messageInput = useMessageInputContext();

  const { Emoji } = useComponentContext();

  return (
    <div className='wrapper'>
      <div>Hey Im Neil</div>
      <Emoji
        onClick={messageInput.onSelectEmoji}
        size={40}
        data={fullEmojiData}
        emoji={'male-mechanic'}
        skin={5}
      />
      <div>The Architect</div>
    </div>
  );
};
