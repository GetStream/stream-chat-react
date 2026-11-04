import React from 'react';

import { ThreadHead as DefaultThreadHead } from '../../Thread/ThreadHead';
import { useComponentContext } from '../../../context';
import { useThreadContext } from '../../Threads';
import { useStateStore } from '../../../store';

import type { ThreadState } from 'stream-chat';
import type { MessageProps } from '../../Message/types';

const parentMessageSelector = ({ parentMessage }: ThreadState) => ({ parentMessage });

/** The props a message list gives each of its messages, which the parent message gets too. */
export type ThreadHeadMessageProps = Omit<Partial<MessageProps>, 'message'>;

/**
 * Keeps only the props the list actually set. A `ThreadHead` override that sets a prop and then
 * spreads its props (`<Message showAvatar {...props} />`) keeps its own value.
 */
const omitUndefinedProps = (messageProps: ThreadHeadMessageProps = {}) =>
  Object.fromEntries(
    Object.entries(messageProps).filter(([, value]) => value !== undefined),
  ) as ThreadHeadMessageProps;

/**
 * The parent message a thread list renders above its replies, or `null` outside a thread.
 *
 * The head belongs to the list, not to `Thread`, because it has to sit inside the scroll
 * container. It takes the list-wide message props the replies get, so handlers such as
 * `onMentionsClick` apply to the parent message as well.
 */
export const useThreadHead = (messageProps?: ThreadHeadMessageProps) => {
  const thread = useThreadContext();
  const { ThreadHead = DefaultThreadHead } = useComponentContext();
  const { parentMessage } = useStateStore(thread?.state, parentMessageSelector) ?? {};

  if (!parentMessage) return null;

  return (
    <ThreadHead
      key={parentMessage.id}
      {...omitUndefinedProps(messageProps)}
      message={parentMessage}
    />
  );
};
