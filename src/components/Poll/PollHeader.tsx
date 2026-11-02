import React, { useMemo } from 'react';
import { usePollContext, useTranslationContext } from '../../context';
import { useStateStore } from '../../store';
import type { PollOptionResponseData, PollState } from 'stream-chat';
import { usePollTextTranslation } from './hooks';

type PollStateSelectorReturnValue = {
  enforce_unique_vote: boolean;
  is_closed: boolean | undefined;
  max_votes_allowed: number | undefined;
  name: string;
  name_i18n: PollState['name_i18n'];
  options: PollOptionResponseData[];
};
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  enforce_unique_vote: nextValue.enforce_unique_vote,
  is_closed: nextValue.is_closed,
  max_votes_allowed: nextValue.max_votes_allowed,
  name: nextValue.name,
  name_i18n: nextValue.name_i18n,
  options: nextValue.options,
});

export const PollHeader = () => {
  const { t } = useTranslationContext();
  const translate = usePollTextTranslation();

  const { poll } = usePollContext();
  const { enforce_unique_vote, is_closed, max_votes_allowed, name, name_i18n, options } =
    useStateStore(poll.state, pollStateSelector);

  const selectionInstructions = useMemo(() => {
    if (is_closed) return t('poll.header.voteEnded.label', 'Vote ended');
    if (enforce_unique_vote || options.length === 1)
      return t('poll.header.selectOne.label', 'Select one');
    if (max_votes_allowed)
      return t('poll.header.selectUp.label', {
        count: max_votes_allowed > options.length ? options.length : max_votes_allowed,
        defaultValue_one: 'Select up to {{count}}',
        defaultValue_other: 'Select up to {{count}}',
      });
    if (options.length > 1)
      return t('poll.header.selectOneMore.label', 'Select one or more');
    return '';
  }, [is_closed, enforce_unique_vote, max_votes_allowed, options.length, t]);

  if (!name) return null;

  return (
    <div className='str-chat__poll-header'>
      <div className='str-chat__poll-title'>{translate(name, name_i18n)}</div>
      <div className='str-chat__poll-subtitle'>{selectionInstructions}</div>
    </div>
  );
};
