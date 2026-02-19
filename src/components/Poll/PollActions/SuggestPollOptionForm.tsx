import React, { useCallback, useMemo } from 'react';
import { useChatContext, usePollContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { PollOption, PollState } from 'stream-chat';
import { Prompt } from '../../Dialog';
import { TextInput } from '../../Form';
import { useFormState } from '../../Form/hooks';

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

  const initialValue = useMemo(() => ({ optionText: '' }), []);
  const validators = useMemo(
    () => ({
      optionText: (v: string) => {
        const trimmed = typeof v === 'string' ? v.trim() : '';
        if (!trimmed) {
          return new Error(t('This field cannot be empty or contain only spaces'));
        }
        const existingOption = options.find((option) => option.text === trimmed);
        if (existingOption) {
          return new Error(t('Option already exists'));
        }
        return undefined;
      },
    }),
    [t, options],
  );

  const onSubmit = useCallback(
    async (formValue: { optionText: string }) => {
      const { poll_option } = await client.createPollOption(poll.id, {
        text: formValue.optionText,
      });
      poll.castVote(poll_option.id, messageId);
      close();
    },
    [client, poll, messageId, close],
  );

  const { fieldErrors, handleSubmit, setFieldValue, value } = useFormState<{
    optionText: string;
  }>({
    initialValue,
    onSubmit,
    validators,
  });

  const submitDisabled = !value.optionText?.trim();

  return (
    <Prompt.Root className='str-chat__prompt-dialog str-chat__modal__suggest-poll-option'>
      <Prompt.Header close={close} title={t('Suggest an option')} />
      <Prompt.Body>
        <form autoComplete='off' onSubmit={handleSubmit}>
          <div className='str-chat__prompt__field'>
            <TextInput
              error={!!fieldErrors.optionText}
              errorMessage={fieldErrors.optionText?.message}
              id='optionText'
              label={t('Suggest an option')}
              name='optionText'
              onChange={(e) => setFieldValue('optionText', e.target.value)}
              required
              type='text'
              value={value.optionText}
            />
          </div>
          <Prompt.Footer>
            <Prompt.FooterControls>
              <Prompt.FooterControlsButton
                className='str-chat__prompt__footer__controls-button--cancel'
                onClick={close}
              >
                {t('Cancel')}
              </Prompt.FooterControlsButton>
              <Prompt.FooterControlsButton
                className='str-chat__prompt__footer__controls-button--submit'
                disabled={Object.keys(fieldErrors).length > 0 || submitDisabled}
                type='submit'
              >
                {t('Send')}
              </Prompt.FooterControlsButton>
            </Prompt.FooterControls>
          </Prompt.Footer>
        </form>
      </Prompt.Body>
    </Prompt.Root>
  );
};
