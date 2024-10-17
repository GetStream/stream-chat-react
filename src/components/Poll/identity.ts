import type { PollAnswer, PollVote } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

export const isPollAnswer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  value: PollAnswer<StreamChatGenerics> | PollVote<StreamChatGenerics>,
): value is PollAnswer<StreamChatGenerics> =>
  !!(value as PollAnswer<StreamChatGenerics>)?.answer_text;
