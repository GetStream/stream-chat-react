import { useMessageComposer } from './hooks';
import React from 'react';
import type { MessageComposerState } from 'stream-chat';
import { useStateStore } from '../../store';
import { useTranslationContext } from '../../context';

const stateSelector = (state: MessageComposerState) => ({
  showReplyInChannel: state.showReplyInChannel,
});

export const SendToChannelCheckbox = () => {
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposer();
  const { showReplyInChannel } = useStateStore(messageComposer.state, stateSelector);

  if (messageComposer.editedMessage || !messageComposer.threadId) return null;

  return (
    <div className='str-chat__send-to-channel-checkbox__container'>
      <div className='str-chat__send-to-channel-checkbox__field'>
        <input
          id='send-to-channel-checkbox'
          onClick={messageComposer.toggleShowReplyInChannel}
          type='checkbox'
          value={showReplyInChannel.toString()}
        />
        <label htmlFor='send-to-channel-checkbox'>
          {Object.keys(messageComposer.channel.state.members).length === 2
            ? t<string>('Also send as a direct message')
            : t<string>('Also send in channel')}
        </label>
      </div>
    </div>
  );
};
