import { FormDialog } from '../../Dialog';
import React from 'react';
import { usePoll, usePollState } from '../hooks';
import { useChatContext, useTranslationContext } from '../../../context';
import type { PollOption, PollState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../../types';

type PollStateSelectorReturnValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = [PollOption<StreamChatGenerics>[]];
const pollStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorReturnValue<StreamChatGenerics> => [nextValue.options];

export type SuggestPollOptionFormProps = {
  close: () => void;
  messageId: string;
};

export const SuggestPollOptionForm = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  close,
  messageId,
}: SuggestPollOptionFormProps) => {
  const { client } = useChatContext('SuggestPollOptionForm');
  const { t } = useTranslationContext('SuggestPollOptionForm');
  const poll = usePoll<StreamChatGenerics>();
  const [options] = usePollState<
    PollStateSelectorReturnValue<StreamChatGenerics>,
    StreamChatGenerics
  >(pollStateSelector);

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
            if (!value) return;
            const existingOption = options.find(
              (option) => option.text === (value as string).trim(),
            );
            if (existingOption) {
              return new Error(t<string>('Option already exists'));
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
      title={t<string>('Suggest an option')}
    />
  );
};
