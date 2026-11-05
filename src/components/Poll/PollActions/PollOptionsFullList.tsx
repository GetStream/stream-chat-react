import React from 'react';
import { Viewer } from '../../Dialog';
import { PollOptionList } from '../PollOptionList';
import { useStateStore } from '../../../store';
import { useModalContext, usePollContext, useTranslationContext } from '../../../context';

import type { PollState } from 'stream-chat';
import { PollQuestion } from './PollQuestion';
import { usePollTextTranslation } from '../hooks';

type PollStateSelectorReturnValue = {
  name: string;
  name_i18n: PollState['name_i18n'];
};
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  name: nextValue.name,
  name_i18n: nextValue.name_i18n,
});

export const PollOptionsFullList = () => {
  const { t } = useTranslationContext();
  const { poll } = usePollContext();
  const { close } = useModalContext();
  const { name, name_i18n } = useStateStore(poll.state, pollStateSelector);
  const translate = usePollTextTranslation();

  return (
    <Viewer.Root className={'str-chat__modal__poll-option-list'}>
      <Viewer.Header
        close={close}
        description={t('Review all options available in this poll')}
        title={t('Poll options')}
      />
      <Viewer.Body className='str-chat__modal__poll-option-list__body'>
        <PollQuestion question={translate(name, name_i18n)} />
        <PollOptionList />
      </Viewer.Body>
    </Viewer.Root>
  );
};
