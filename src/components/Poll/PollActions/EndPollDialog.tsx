import React from 'react';
import { Prompt } from '../../Dialog';
import { usePollContext, useTranslationContext } from '../../../context';

export type EndPollDialogProps = {
  close: () => void;
};

export const EndPollDialog = ({ close }: EndPollDialogProps) => {
  const { t } = useTranslationContext('SuggestPollOptionForm');
  const { poll } = usePollContext();

  return (
    <Prompt.Root className={'str-chat__modal__end-vote'}>
      <Prompt.Header close={close} title={t('End vote')}></Prompt.Header>
      <Prompt.Body>
        <div className='str-chat__prompt__prompt'>
          {t('Nobody will be able to vote in this poll anymore.')}
        </div>
      </Prompt.Body>
      <Prompt.Footer>
        <Prompt.FooterControls>
          <Prompt.FooterControlsButtonSecondary
            className='str-chat__dialog__controls-button--cancel'
            onClick={close}
          >
            {t('Cancel')}
          </Prompt.FooterControlsButtonSecondary>
          <Prompt.FooterControlsButtonPrimary
            className='str-chat__dialog__controls-button--end-poll'
            onClick={() => {
              poll.close();
              close();
            }}
          >
            {t('End')}
          </Prompt.FooterControlsButtonPrimary>
        </Prompt.FooterControls>
      </Prompt.Footer>
    </Prompt.Root>
  );
};
