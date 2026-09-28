import React from 'react';

import { ThreadHead as DefaultThreadHead } from '../../Thread/ThreadHead';
import { useComponentContext } from '../../../context';
import { useThreadContext } from '../../Threads';
import { useStateStore } from '../../../store';

import type { ThreadState } from 'stream-chat';

const parentMessageSelector = ({ parentMessage }: ThreadState) => ({ parentMessage });

/**
 * The parent message a thread list renders above its replies, or `null` outside a thread.
 *
 * The head belongs to the list rather than to `Thread` because it has to sit inside the scroll
 * container -- a sibling of the list could not be placed there. Style choices stay with the
 * caller; only this structural one is resolved from context.
 */
export const useThreadHead = () => {
  const thread = useThreadContext();
  const { ThreadHead = DefaultThreadHead } = useComponentContext();
  const { parentMessage } = useStateStore(thread?.state, parentMessageSelector) ?? {};

  if (!parentMessage) return null;

  return <ThreadHead key={parentMessage.id} message={parentMessage} />;
};
