import React from 'react';
import { useCanCreatePoll, useMessageComposer } from '../../MessageInput';
import { useTranslationContext } from '../../../context';
import { useSendMessageFn } from '../../MessageInput/hooks/useSendMessageFn';

export type PollCreationDialogControlsProps = {
  close: () => void;
};

export const PollCreationDialogControls = ({
  close,
}: PollCreationDialogControlsProps) => {
  const { t } = useTranslationContext('PollCreationDialogControls');
  const messageComposer = useMessageComposer();
  const sendMessage = useSendMessageFn();
  const canCreatePoll = useCanCreatePoll();

  return (
    <div className='str-chat__dialog__controls'>
      <button
        className='str-chat__dialog__controls-button str-chat__dialog__controls-button--cancel'
        onClick={() => {
          messageComposer.pollComposer.initState();
          close();
        }}
        type='button'
      >
        {t('Cancel')}
      </button>
      <button
        className='str-chat__dialog__controls-button str-chat__dialog__controls-button--submit'
        disabled={!canCreatePoll}
        onClick={() => {
          messageComposer
            .createPoll()
            .then(sendMessage)
            .then(() => {
              messageComposer.pollComposer.initState();
              close();
            })
            .catch(console.error);
        }}
        type='submit'
      >
        {t('Create')}
      </button>
    </div>
  );
};
