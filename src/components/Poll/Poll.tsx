import React from 'react';
import { PollContent as DefaultPollContent } from './PollContent';
import { QuotedPoll as DefaultQuotedPoll } from './QuotedPoll';
import { PollProvider, useComponentContext } from '../../context';
import type { Poll as PollClass } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

export const Poll = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  isQuoted,
  poll,
}: {
  poll: PollClass<StreamChatGenerics>;
  isQuoted?: boolean;
}) => {
  const { PollContent = DefaultPollContent, QuotedPoll = DefaultQuotedPoll } =
    useComponentContext();
  return poll ? (
    <PollProvider poll={poll}>{isQuoted ? <QuotedPoll /> : <PollContent />}</PollProvider>
  ) : null;
};
