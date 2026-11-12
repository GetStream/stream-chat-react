import { type AIConversationStatus, isAIConversationAnswering } from './types';

import type { AIBranchSwitch } from '../../Message/AIBranchSwitcher';
import type { AIMessageRating, AIReplyActionsProps } from '../../Message/AIReplyActions';
import type { AIUserMessageActions } from '../AIConversation';
import type { AIMessage, AIMessageBranch } from '../types';

type Offerer<Message extends AIMessage> = {
  actions: { edit: boolean; rate: boolean; regenerate: boolean };
  canSwitchBranch: boolean;
  edit: (message: Message) => void;
  rate: (reply: Message, rating: AIMessageRating | null) => void;
  regenerate: (reply: Message) => void;
  switchBranch: (message: Message, to: 'previous' | 'next') => void;
};

// The ‹ i/n › switcher of a message with several versions of the kind `of`, while the transport
// can switch them. Its arrows are left out at their ends and while the agent is answering.
const branchSwitchOf = <Message extends AIMessage>(
  offerer: Offerer<Message>,
  status: AIConversationStatus,
  message: Message,
  of: AIMessageBranch['of'],
): AIBranchSwitch | undefined => {
  const { branch } = message;
  if (!offerer.canSwitchBranch || branch?.of !== of || !(branch.count > 1)) {
    return undefined;
  }
  const { count, index } = branch;
  const isAnswering = isAIConversationAnswering(status);
  return {
    count,
    index,
    onNext:
      !isAnswering && index < count
        ? () => offerer.switchBranch(message, 'next')
        : undefined,
    onPrevious:
      !isAnswering && index > 1
        ? () => offerer.switchBranch(message, 'previous')
        : undefined,
  };
};

// What the person can do with a finished reply: rate it, write it again while the agent isn't
// answering (the latest only, or any while the transport can switch versions), and switch
// between its versions.
export const replyActionsOf = <Message extends AIMessage>(
  offerer: Offerer<Message>,
  {
    ratings,
    status,
  }: {
    ratings: Readonly<Record<string, AIMessageRating>>;
    status: AIConversationStatus;
  },
  reply: Message,
  isLatestReply: boolean,
): Omit<AIReplyActionsProps, 'text'> => {
  const actions: Omit<AIReplyActionsProps, 'text'> = {
    onRate: offerer.actions.rate ? (rating) => offerer.rate(reply, rating) : undefined,
    onRegenerate:
      offerer.actions.regenerate &&
      (isLatestReply || offerer.canSwitchBranch) &&
      !isAIConversationAnswering(status)
        ? () => offerer.regenerate(reply)
        : undefined,
    rating: ratings[reply.id] ?? null,
  };
  const branch = branchSwitchOf(offerer, status, reply, 'reply');
  if (branch) actions.branch = branch;
  return actions;
};

/** The id of the person's latest message, the one they can edit. */
export const latestUserMessageIdOf = (messages: readonly AIMessage[]) => {
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].role === 'user') return messages[index].id;
  }
  return undefined;
};

// Edits a message of the person's while the agent isn't answering: their latest, or any while
// the transport can switch versions.
export const editActionOf = <Message extends AIMessage>(
  offerer: Offerer<Message>,
  {
    latestUserMessageId,
    status,
  }: { latestUserMessageId: string | undefined; status: AIConversationStatus },
  message: Message,
): (() => void) | undefined => {
  if (
    !offerer.actions.edit ||
    message.role !== 'user' ||
    isAIConversationAnswering(status)
  ) {
    return undefined;
  }
  return offerer.canSwitchBranch || latestUserMessageId === message.id
    ? () => offerer.edit(message)
    : undefined;
};

// What a message of the person's offers besides editing it in the composer: the switcher
// between the versions of a question they edited, while the transport can switch them.
export const userMessageActionsOf = <Message extends AIMessage>(
  offerer: Offerer<Message>,
  { status }: { status: AIConversationStatus },
  message: Message,
): AIUserMessageActions | undefined => {
  if (message.role !== 'user') return undefined;
  const branch = branchSwitchOf(offerer, status, message, 'question');
  return branch ? { branch } : undefined;
};
