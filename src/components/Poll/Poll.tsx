import React from 'react';
import { PollContent as DefaultPollContent } from './PollContent';
import { PollProvider, useComponentContext } from '../../context';
import type { PollProps } from './types';

export const Poll = ({ poll, translationView }: PollProps) => {
  const { PollContent = DefaultPollContent } = useComponentContext();
  if (!poll) return null;
  return (
    <PollProvider poll={poll} translationView={translationView}>
      <PollContent />
    </PollProvider>
  );
};
