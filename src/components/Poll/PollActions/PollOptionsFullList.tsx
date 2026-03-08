import React from 'react';
import { Viewer } from '../../Dialog';
import { PollOptionList } from '../PollOptionList';
import { useStateStore } from '../../../store';
import { useModalContext, usePollContext, useTranslationContext } from '../../../context';

import type { PollState } from 'stream-chat';
import { PollQuestion } from './PollQuestion';

type PollStateSelectorReturnValue = { name: string };
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  name: nextValue.name,
});

export const PollOptionsFullList = () => {
  const { t } = useTranslationContext();
  const { poll } = usePollContext();
  const { close } = useModalContext();
  const { name } = useStateStore(poll.state, pollStateSelector);

  return (
    <Viewer.Root className={'str-chat__modal__poll-option-list'}>
      <Viewer.Header close={close} title={t('Poll options')} />
      <Viewer.Body className='str-chat__modal__poll-option-list__body'>
        <PollQuestion question={name} />
        <PollOptionList />
      </Viewer.Body>
    </Viewer.Root>
  );
};
