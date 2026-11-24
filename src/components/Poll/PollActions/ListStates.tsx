import React from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../../context';

// The poll answer list's own empty state; its other states are the shared `List…` defaults.

/** The poll answers' empty state: an icon and "No comments yet". */
export const PollAnswerListEmpty = () => {
  const { t } = useTranslationContext();
  const { IconMessageBubble } = useComponentContextIcons();
  return (
    <div className='str-chat__poll-answer-list-empty'>
      <IconMessageBubble />
      <p>{t('poll.answerList.empty.text', 'No comments yet')}</p>
    </div>
  );
};
