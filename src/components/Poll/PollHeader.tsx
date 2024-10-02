import React, { useMemo } from 'react';
import { usePollState } from './hooks';
import { useTranslationContext } from '../../context';
import type { PollState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

type PollStateSelectorReturnValue = [boolean, boolean | undefined, number, string];
const pollStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: PollState<StreamChatGenerics>,
): PollStateSelectorReturnValue => [
  nextValue.enforce_unique_vote,
  nextValue.is_closed,
  nextValue.max_votes_allowed,
  nextValue.name,
];

export const PollHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { t } = useTranslationContext('PollHeader');
  const [enforce_unique_vote, is_closed, max_votes_allowed, name] = usePollState<
    PollStateSelectorReturnValue,
    StreamChatGenerics
  >(pollStateSelector);

  const selectionInstructions = useMemo(() => {
    if (is_closed) return t<string>('Vote ended');
    if (enforce_unique_vote) return t<string>('Select one');
    if (max_votes_allowed) return t<string>('Select up to {{count}}', { count: max_votes_allowed });
    return t<string>('Select one or more');
  }, [is_closed, enforce_unique_vote, max_votes_allowed, t]);

  if (!name) return;

  return (
    <div className='str-chat__poll-header'>
      <div className='str-chat__poll-title'>{name}</div>
      <div className='str-chat__poll-subtitle'>{selectionInstructions}</div>
    </div>
  );
};
