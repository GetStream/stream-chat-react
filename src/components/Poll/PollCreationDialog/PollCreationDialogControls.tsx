import React from 'react';
import { useCanCreatePoll, useMessageComposer } from '../../MessageInput';
import { useMessageInputContext, useTranslationContext } from '../../../context';

export type PollCreationDialogControlsProps = {
  close: () => void;
};

export const PollCreationDialogControls = ({
  close,
}: PollCreationDialogControlsProps) => {
  const { t } = useTranslationContext('PollCreationDialogControls');
  const { handleSubmit: handleSubmitMessage } = useMessageInputContext();
  const messageComposer = useMessageComposer();
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
            .then(() => handleSubmitMessage())
            .then(close)
            .catch(console.error);
        }}
        type='submit'
      >
        {t('Create')}
      </button>
    </div>
  );
};
