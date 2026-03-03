import clsx from 'clsx';
import React from 'react';
import { useMessageComposer } from './hooks';
import { IconCheckmark2 } from '../Icons';
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

  const labelText =
    Object.keys(messageComposer.channel.state.members).length === 2
      ? t('Also send as a direct message')
      : t('Also send in channel');

  return (
    <div
      className={clsx('str-chat__send-to-channel-checkbox__container', {
        'str-chat__send-to-channel-checkbox__container--checked': showReplyInChannel,
      })}
      data-testid='send-to-channel-checkbox'
    >
      <label
        className='str-chat__send-to-channel-checkbox__field'
        htmlFor='send-to-channel-checkbox'
      >
        <input
          aria-checked={showReplyInChannel}
          checked={showReplyInChannel}
          className='str-chat__send-to-channel-checkbox__input'
          id='send-to-channel-checkbox'
          onChange={() => messageComposer.toggleShowReplyInChannel()}
          type='checkbox'
        />
        <span aria-hidden className='str-chat__send-to-channel-checkbox__visual'>
          <span className='str-chat__send-to-channel-checkbox__checkmark'>
            <IconCheckmark2 />
          </span>
        </span>
        <span className='str-chat__send-to-channel-checkbox__label'>{labelText}</span>
      </label>
    </div>
  );
};
