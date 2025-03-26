import React from 'react';
import { VALID_MAX_VOTES_VALUE_REGEX } from '../constants';
import {
  useChatContext,
  useMessageInputContext,
  useTranslationContext,
} from '../../../context';
import type { PollFormState } from './types';

export type PollCreationDialogControlsProps = {
  close: () => void;
  errors: string[];
  state: PollFormState;
};

export const PollCreationDialogControls = ({
  close,
  errors,
  state,
}: PollCreationDialogControlsProps) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext('PollCreationDialogControls');
  const { handleSubmit: handleSubmitMessage } = useMessageInputContext(
    'PollCreationDialogControls',
  );

  const canSubmit = () => {
    const hasAtLeastOneOption = state.options.filter((o) => !!o.text).length > 0;
    const hasName = !!state.name;
    const maxVotesAllowedNumber = parseInt(
      state.max_votes_allowed?.match(VALID_MAX_VOTES_VALUE_REGEX)?.[0] || '',
    );

    const validMaxVotesAllowed =
      state.max_votes_allowed === '' ||
      (!!maxVotesAllowedNumber &&
        (2 <= maxVotesAllowedNumber || maxVotesAllowedNumber <= 10));

    const noErrors = errors.length === 0;

    return hasAtLeastOneOption && hasName && validMaxVotesAllowed && noErrors;
  };

  return (
    <div className='str-chat__dialog__controls'>
      <button
        className='str-chat__dialog__controls-button str-chat__dialog__controls-button--cancel'
        onClick={close}
      >
        {t<string>('Cancel')}
      </button>
      <button
        className='str-chat__dialog__controls-button str-chat__dialog__controls-button--submit'
        disabled={!canSubmit()}
        onClick={async (e) => {
          let pollId: string;
          try {
            const { poll } = await client.createPoll({
              ...state,
              max_votes_allowed: state.max_votes_allowed
                ? parseInt(state.max_votes_allowed)
                : undefined,
              options: state.options
                ?.filter((o) => o.text)
                .map((o) => ({ text: o.text })),
            });
            pollId = poll.id;
          } catch (e) {
            // todo: add notification
            return;
          }
          try {
            // todo: move poll creation to LLC
            // @ts-expect-error poll reference to be passed inside messageComposer
            await handleSubmitMessage(e, { poll_id: pollId });
          } catch (e) {
            // todo: add notification
            return;
          }
          close();
        }}
        type='submit'
      >
        {t<string>('Create')}
      </button>
    </div>
  );
};
