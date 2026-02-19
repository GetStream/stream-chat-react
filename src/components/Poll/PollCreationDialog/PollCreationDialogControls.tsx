import React from 'react';
import { useCanCreatePoll, useMessageComposer } from '../../MessageInput';
import { useMessageInputContext, useTranslationContext } from '../../../context';
import { Button } from '../../Button';
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
    <Prompt.Footer className='str-chat__prompt__footer__controls'>
      <Prompt.FooterControls>
        <Prompt.FooterControlsButton
          className={clsx(
            'str-chat__prompt__footer__controls-button--cancel',
            'str-chat__button--secondary',
            'str-chat__button--ghost',
            'str-chat__button--size-md',
          )}
          onClick={() => {
            messageComposer.pollComposer.initState();
            close();
          }}
          type='button'
        >
          {t('Cancel')}
        </Prompt.FooterControlsButton>
        <Button
          className={clsx(
            'str-chat__prompt__footer__controls-button--submit',
            'str-chat__button--primary',
            'str-chat__button--solid',
            'str-chat__button--size-md',
          )}
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
          type='submit'
        >
          <IconPaperPlane />
          {t('Send poll')}
        </Button>
      </Prompt.FooterControls>
    </Prompt.Footer>
  );
};
