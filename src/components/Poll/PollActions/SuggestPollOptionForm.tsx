import React from 'react';
import { FormDialog } from '../../Dialog/FormDialog';
import { useChatContext, usePollContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { PollOption, PollState } from 'stream-chat';

type PollStateSelectorReturnValue = { options: PollOption[] };
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  options: nextValue.options,
});

export type SuggestPollOptionFormProps = {
  close: () => void;
  messageId: string;
};

export const SuggestPollOptionForm = ({
  close,
  messageId,
}: SuggestPollOptionFormProps) => {
  const { client } = useChatContext('SuggestPollOptionForm');
  const { t } = useTranslationContext('SuggestPollOptionForm');
  const { poll } = usePollContext();
  const { options } = useStateStore(poll.state, pollStateSelector);

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
          validator: (value) => {
            const valueString = typeof value !== 'undefined' ? value.toString() : value;
            const trimmedValue = valueString?.trim();
            if (!trimmedValue) {
              return new Error(t('This field cannot be empty or contain only spaces'));
            }
            const existingOption = options.find((option) => option.text === trimmedValue);
            if (existingOption) {
              return new Error(t('Option already exists'));
            }
            return;
          },
        },
      }}
      onSubmit={async (value) => {
        const { poll_option } = await client.createPollOption(poll.id, {
          text: value.optionText,
        });
        poll.castVote(poll_option.id, messageId);
      }}
      shouldDisableSubmitButton={(value) => !value.optionText}
      title={t('Suggest an option')}
    />
  );
};
