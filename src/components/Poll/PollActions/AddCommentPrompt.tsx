import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useStateStore } from '../../../store';
import { useModalContext, usePollContext, useTranslationContext } from '../../../context';
import type { PollState, PollVoteResponseData } from 'stream-chat';
import { Prompt } from '../../Dialog';
import { TextInput } from '../../Form';
import { useFormState } from '../../Form/hooks';

type PollStateSelectorReturnValue = { ownAnswer: PollVoteResponseData | undefined };
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  ownAnswer: nextValue.ownAnswer,
});

export type AddCommentPromptProps = {
  messageId: string;
};

export const AddCommentPrompt = ({ messageId }: AddCommentPromptProps) => {
  const { t } = useTranslationContext();
  const { close } = useModalContext();
  const { poll } = usePollContext();
  const { ownAnswer } = useStateStore(poll.state, pollStateSelector);
  const [input, setInput] = useState<HTMLInputElement | null>(null);

  const initialComment = ownAnswer?.answer_text ?? '';
  const initialValue = useMemo(() => ({ comment: initialComment }), [initialComment]);
  const validators = useMemo(
    () => ({
      comment: (v: string) => {
        const trimmed = typeof v === 'string' ? v.trim() : '';
        if (!trimmed) {
          return new Error(
            t(
              'poll.addCommentPrompt.fieldCannotEmptyContain.label',
              'This field cannot be empty or contain only spaces',
            ),
          );
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

  useEffect(() => {
    input?.focus();
  }, [input]);

  const title = ownAnswer
    ? t('poll.addCommentPrompt.updateComment.label', 'Update Your Comment')
    : t('poll.addCommentPrompt.addComment.label', 'Add a Comment');
  const description = ownAnswer
    ? t(
        'poll.addCommentPrompt.updateCommentAttachedPoll.label',
        'Update the comment attached to your poll answer',
      )
    : t(
        'poll.addCommentPrompt.addCommentPollAnswer.label',
        'Add a comment to your poll answer',
      );
  const submitDisabled =
    !value.comment?.trim() || value.comment === ownAnswer?.answer_text;

  return (
    <Prompt.Root className='str-chat__modal__poll-add-comment'>
      {title && <Prompt.Header close={close} description={description} title={title} />}
      <form autoComplete='off' onSubmit={handleSubmit}>
        <Prompt.Body>
          <TextInput
            aria-label={title}
            error={!!fieldErrors.comment}
            errorMessage={fieldErrors.comment?.message}
            id='comment'
            name='comment'
            onChange={(e) => setFieldValue('comment', e.target.value)}
            placeholder={t('poll.pollComment.placeholder', 'Your comment')}
            ref={setInput}
            required
            type='text'
            value={value.comment}
          />
        </Prompt.Body>
        <Prompt.Footer>
          <Prompt.FooterControls>
            <Prompt.FooterControlsButtonSecondary
              className='str-chat__prompt__footer__controls-button--cancel'
              onClick={close}
              type='button'
            >
              {t('common.cancel.label', 'Cancel')}
            </Prompt.FooterControlsButtonSecondary>
            <Prompt.FooterControlsButtonPrimary
              className='str-chat__prompt__footer__controls-button--submit'
              disabled={Object.keys(fieldErrors).length > 0 || submitDisabled}
              type='submit'
            >
              {initialComment
                ? t('poll.addCommentPrompt.update.text', 'Update')
                : t('common.send.label', 'Send')}
            </Prompt.FooterControlsButtonPrimary>
          </Prompt.FooterControls>
        </Prompt.Footer>
      </form>
    </Prompt.Root>
  );
};
