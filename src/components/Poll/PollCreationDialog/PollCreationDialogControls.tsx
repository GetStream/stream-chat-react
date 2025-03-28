import React from 'react';
import { useMessageComposer } from '../../MessageInput/hooks/messageComposer/useMessageComposer';
import { useMessageInputContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { PollComposerState } from 'stream-chat';

const pollComposerStateSelector = (state: PollComposerState) => ({
  errors: Object.values(state.errors).filter((e) => e),
});

export type PollCreationDialogControlsProps = {
  close: () => void;
};

export const PollCreationDialogControls = ({
  close,
}: PollCreationDialogControlsProps) => {
  const { t } = useTranslationContext('PollCreationDialogControls');
  const { handleSubmit: handleSubmitMessage } = useMessageInputContext();
  const messageComposer = useMessageComposer();
  const { errors } = useStateStore(
    messageComposer.pollComposer.state,
    pollComposerStateSelector,
  );

  return (
    <div className='str-chat__dialog__controls'>
      <button
        className='str-chat__dialog__controls-button str-chat__dialog__controls-button--cancel'
        onClick={() => {
          messageComposer.pollComposer.initState();
          close();
        }}
      >
        {t<string>('Cancel')}
      </button>
      <button
        className='str-chat__dialog__controls-button str-chat__dialog__controls-button--submit'
        disabled={!messageComposer.pollComposer.canCreatePoll || errors.length > 0}
        onClick={() => {
          messageComposer
            .createPoll()
            .then(() => handleSubmitMessage())
            .then(close)
            .catch(console.error);
        }}
        type='submit'
      >
        {t<string>('Create')}
      </button>
    </div>
  );
};
