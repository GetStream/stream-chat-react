import React from 'react';
import { PollContent as DefaultPollContent } from './PollContent';
import { PollProvider, useComponentContext } from '../../context';
import type { Poll as PollClass } from 'stream-chat';

export const Poll = ({ poll }: { poll: PollClass }) => {
  const { PollContent = DefaultPollContent } = useComponentContext();
  if (!poll) return null;
  return (
    <PollProvider poll={poll}>
      <PollContent />
    </PollProvider>
  );
};
