import { PromptDialog } from '../../Dialog/PromptDialog';
import React from 'react';
import { usePollContext, useTranslationContext } from '../../../context';

export type EndPollDialogProps = {
  close: () => void;
};

export const EndPollDialog = ({ close }: EndPollDialogProps) => {
  const { t } = useTranslationContext('SuggestPollOptionForm');
  const { poll } = usePollContext();

  return (
    <PromptDialog
      actions={[
        {
          children: t<string>('Cancel'),
          className: 'str-chat__dialog__controls-button--cancel',
          onClick: close,
        },
        {
          children: t<string>('End'),
          className:
            '.str-chat__dialog__controls-button--submit str-chat__dialog__controls-button--end-poll',
          onClick: poll.close,
        },
      ]}
      className='str-chat__modal__end-vote'
      prompt={t<string>('Nobody will be able to vote in this poll anymore.')}
      title={t<string>('End vote')}
    />
  );
};
