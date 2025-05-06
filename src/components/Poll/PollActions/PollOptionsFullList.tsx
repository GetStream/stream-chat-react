import React from 'react';
import { ModalHeader } from '../../Modal/ModalHeader';
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
    <div className={'str-chat__modal__poll-option-list'}>
      <ModalHeader close={close} title={t<string>('Poll options')} />
      <div className='str-chat__modal__poll-option-list__body'>
        <div className='str-chat__modal__poll-option-list__title'>{name}</div>
        <PollOptionList />
      </div>
    </div>
  );
};
