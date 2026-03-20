import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useChatContext,
  useModalContext,
  usePollContext,
  useTranslationContext,
} from '../../../context';
import { useStateStore } from '../../../store';
import type { PollOption, PollState } from 'stream-chat';
import { Prompt } from '../../Dialog';
import { TextInput } from '../../Form';
import { useFormState } from '../../Form/hooks';

type PollStateSelectorReturnValue = { options: PollOption[] };
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  options: nextValue.options,
});

export type SuggestPollOptionFormProps = Record<string, never>;

export const SuggestPollOptionPrompt = () => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { poll } = usePollContext();
  const { close } = useModalContext();
  const { options } = useStateStore(poll.state, pollStateSelector);
  const [input, setInput] = useState<HTMLInputElement | null>(null);

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
      await client.createPollOption(poll.id, {
        text: formValue.optionText,
      });
      close();
    },
    [client, poll, close],
  );

  const { fieldErrors, handleSubmit, setFieldValue, value } = useFormState<{
    optionText: string;
  }>({
    initialValue,
    onSubmit,
    validators,
  });

  useEffect(() => {
    input?.focus();
  }, [input]);

  const submitDisabled = !value.optionText?.trim();

  return (
    <Prompt.Root className='str-chat__modal__suggest-poll-option-prompt'>
      <Prompt.Header close={close} title={t('Suggest an option')} />
      <form autoComplete='off' onSubmit={handleSubmit}>
        <Prompt.Body>
          <TextInput
            aria-label={t('Suggest an option')}
            error={!!fieldErrors.optionText}
            errorMessage={fieldErrors.optionText?.message}
            id='optionText'
            name='optionText'
            onChange={(e) => setFieldValue('optionText', e.target.value)}
            placeholder={t('placeholder/PollOptionSuggestion')}
            ref={setInput}
            required
            type='text'
            value={value.optionText}
          />
        </Prompt.Body>
        <Prompt.Footer>
          <Prompt.FooterControls>
            <Prompt.FooterControlsButtonSecondary
              className='str-chat__prompt__footer__controls-button--cancel'
              onClick={close}
            >
              {t('Cancel')}
            </Prompt.FooterControlsButtonSecondary>
            <Prompt.FooterControlsButtonPrimary
              className='str-chat__prompt__footer__controls-button--submit'
              disabled={Object.keys(fieldErrors).length > 0 || submitDisabled}
              type='submit'
            >
              {t('Send')}
            </Prompt.FooterControlsButtonPrimary>
          </Prompt.FooterControls>
        </Prompt.Footer>
      </form>
    </Prompt.Root>
  );
};
