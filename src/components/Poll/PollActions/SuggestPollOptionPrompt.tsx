import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useChatContext,
  useModalContext,
  usePollContext,
  useTranslationContext,
} from '../../../context';
import { useStateStore } from '../../../store';
import type { PollOptionResponseData, PollState } from 'stream-chat';
import { Prompt } from '../../Dialog';
import { TextInput } from '../../Form';
import { useFormState } from '../../Form/hooks';

type PollStateSelectorReturnValue = { options: PollOptionResponseData[] };
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
          return new Error(
            t(
              'poll.addCommentPrompt.fieldCannotEmptyContain.label',
              'This field cannot be empty or contain only spaces',
            ),
          );
        }
        const existingOption = options.find((option) => option.text === trimmed);
        if (existingOption) {
          return new Error(
            t(
              'poll.suggestPollOption.optionAlreadyExists.label',
              'Option already exists',
            ),
          );
        }
        return undefined;
      },
    }),
    [t, options],
  );

  const onSubmit = useCallback(
    async (formValue: { optionText: string }) => {
      await client.createPollOption({
        poll_id: poll.id,
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
      <Prompt.Header
        close={close}
        description={t(
          'poll.suggestPollOption.description',
          'Suggest a new option to add to this poll',
        )}
        title={t('poll.actions.suggestOption.label', 'Suggest an Option')}
      />
      <form autoComplete='off' onSubmit={handleSubmit}>
        <Prompt.Body>
          <TextInput
            aria-label={t('poll.actions.suggestOption.label', 'Suggest an Option')}
            error={!!fieldErrors.optionText}
            errorMessage={fieldErrors.optionText?.message}
            id='optionText'
            name='optionText'
            onChange={(e) => setFieldValue('optionText', e.target.value)}
            placeholder={t('poll.pollOptionSuggestion.placeholder', 'Enter a new option')}
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
              {t('common.cancel.label', 'Cancel')}
            </Prompt.FooterControlsButtonSecondary>
            <Prompt.FooterControlsButtonPrimary
              className='str-chat__prompt__footer__controls-button--submit'
              disabled={Object.keys(fieldErrors).length > 0 || submitDisabled}
              type='submit'
            >
              {t('common.send.label', 'Send')}
            </Prompt.FooterControlsButtonPrimary>
          </Prompt.FooterControls>
        </Prompt.Footer>
      </form>
    </Prompt.Root>
  );
};
