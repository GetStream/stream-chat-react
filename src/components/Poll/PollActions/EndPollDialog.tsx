import { PromptDialog } from '../../Dialog';
import React from 'react';
import { useTranslationContext } from '../../../context';
import { usePoll } from '../hooks';
import type { DefaultStreamChatGenerics } from '../../../types';

export type EndPollDialogProps = {
  close: () => void;
};

export const EndPollDialog = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  close,
}: EndPollDialogProps) => {
  const { t } = useTranslationContext('SuggestPollOptionForm');
  const poll = usePoll<StreamChatGenerics>();
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
