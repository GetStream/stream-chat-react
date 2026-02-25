import React from 'react';
import { useCanCreatePoll, useMessageComposer } from '../../MessageInput';
import { useMessageInputContext, useTranslationContext } from '../../../context';
import clsx from 'clsx';
import { IconPaperPlane } from '../../Icons';
import { Prompt } from '../../Dialog';

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
    <Prompt.Footer>
      <Prompt.FooterControls>
        <Prompt.FooterControlsButtonSecondary
          className={clsx('str-chat__prompt__footer__controls-button--cancel')}
          onClick={() => {
            messageComposer.pollComposer.initState();
            close();
          }}
          type='button'
        >
          {t('Cancel')}
        </Prompt.FooterControlsButtonSecondary>
        <Prompt.FooterControlsButtonPrimary
          className={clsx('str-chat__prompt__footer__controls-button--submit')}
          disabled={!canCreatePoll}
          onClick={() => {
            messageComposer
              .createPoll()
              .then(() => handleSubmitMessage())
              .then(() => {
                messageComposer.pollComposer.initState();
                close();
              })
              .catch(console.error);
          }}
        >
          <IconPaperPlane />
          {t('Send poll')}
        </Prompt.FooterControlsButtonPrimary>
      </Prompt.FooterControls>
    </Prompt.Footer>
  );
};
