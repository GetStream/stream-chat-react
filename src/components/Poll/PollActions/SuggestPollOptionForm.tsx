import { FormDialog } from '../../Dialog';
import React from 'react';
import { useChatContext, useTranslationContext } from '../../../context';
import { usePoll } from '../hooks';
import type { DefaultStreamChatGenerics } from '../../../types';

export type SuggestPollOptionFormProps = {
  close: () => void;
};

export const SuggestPollOptionForm = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  close,
}: SuggestPollOptionFormProps) => {
  const { client } = useChatContext('SuggestPollOptionForm');
  const { t } = useTranslationContext('SuggestPollOptionForm');
  const poll = usePoll<StreamChatGenerics>();
  return (
    <FormDialog<{ optionText: '' }>
      className='str-chat__prompt-dialog str-chat__modal__suggest-poll-option'
      close={close}
      fields={{
        optionText: {
          element: 'input',
          props: {
            id: 'optionText',
            name: 'optionText',
            required: true,
            type: 'text',
            value: '',
          },
        },
      }}
      onSubmit={async (value) => {
        await client.createPollOption(poll.id, { text: value.optionText });
      }}
      shouldDisableSubmitButton={(value) => !value.optionText}
      title={t<string>('Suggest an option')}
    />
  );
};
