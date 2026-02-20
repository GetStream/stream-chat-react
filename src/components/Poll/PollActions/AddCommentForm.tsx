import React, { useCallback, useMemo } from 'react';
import { useStateStore } from '../../../store';
import { usePollContext, useTranslationContext } from '../../../context';
import type { PollAnswer, PollState } from 'stream-chat';
import { Prompt } from '../../Dialog';
import { TextInput } from '../../Form';
import { useFormState } from '../../Form/hooks';

type PollStateSelectorReturnValue = { ownAnswer: PollAnswer | undefined };
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  ownAnswer: nextValue.ownAnswer,
});

export type AddCommentFormProps = {
  close: () => void;
  messageId: string;
};

export const AddCommentForm = ({ close, messageId }: AddCommentFormProps) => {
  const { t } = useTranslationContext('AddCommentForm');
  const { poll } = usePollContext();
  const { ownAnswer } = useStateStore(poll.state, pollStateSelector);

  const initialComment = ownAnswer?.answer_text ?? '';
  const initialValue = useMemo(() => ({ comment: initialComment }), [initialComment]);
  const validators = useMemo(
    () => ({
      comment: (v: string) => {
        const trimmed = typeof v === 'string' ? v.trim() : '';
        if (!trimmed) {
          return new Error(t('This field cannot be empty or contain only spaces'));
        }
        return undefined;
      },
    }),
    [t],
  );
  const onSubmit = useCallback(
    async (formValue: { comment: string }) => {
      await poll.addAnswer(formValue.comment, messageId);
      close();
    },
    [poll, messageId, close],
  );
  const { fieldErrors, handleSubmit, setFieldValue, value } = useFormState<{
    comment: string;
  }>({
    initialValue,
    onSubmit,
    validators,
  });

  const title = ownAnswer ? t('Update your comment') : t('Add a comment');
  const submitDisabled =
    !value.comment?.trim() || value.comment === ownAnswer?.answer_text;

  return (
    <Prompt.Root className='str-chat__modal__poll-add-comment'>
      {title && <Prompt.Header close={close} title={title} />}
      <Prompt.Body>
        <form autoComplete='off' onSubmit={handleSubmit}>
          <TextInput
            error={!!fieldErrors.comment}
            errorMessage={fieldErrors.comment?.message}
            id='comment'
            name='comment'
            onChange={(e) => setFieldValue('comment', e.target.value)}
            required
            title={title}
            type='text'
            value={value.comment}
          />
        </form>
      </Prompt.Body>
      <Prompt.Footer>
        <Prompt.FooterControls>
          <Prompt.FooterControlsButtonSecondary
            className='str-chat__prompt__footer__controls-button--cancel'
            onClick={close}
            type='button'
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
    </Prompt.Root>
  );
};
