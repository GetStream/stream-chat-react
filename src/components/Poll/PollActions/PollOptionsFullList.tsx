import React from 'react';
import { Prompt } from '../../Dialog';
import { PollOptionList } from '../PollOptionList';
import { useStateStore } from '../../../store';
import { usePollContext, useTranslationContext } from '../../../context';

import type { PollState } from 'stream-chat';

type PollStateSelectorReturnValue = { name: string };
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  name: nextValue.name,
});

export type FullPollOptionsListingProps = {
  close?: () => void;
};

export const PollOptionsFullList = ({ close }: FullPollOptionsListingProps) => {
  const { t } = useTranslationContext();
  const { poll } = usePollContext();
  const { name } = useStateStore(poll.state, pollStateSelector);

  return (
    <Prompt.Root className={'str-chat__modal__poll-option-list'}>
      <Prompt.Header close={close} title={t('Poll options')} />
      <Prompt.Body className='str-chat__modal__poll-option-list__body'>
        <div className='str-chat__modal__poll-option-list__title'>{name}</div>
        <PollOptionList />
      </Prompt.Body>
    </Prompt.Root>
  );
};
