import { useMemo } from 'react';
import type {
  Channel,
  LocalMessage,
  MessageReceiptsSnapshot,
  MsgRef,
  UserResponse,
} from 'stream-chat';

import { useStateStore } from '../../../store/hooks/useStateStore';

export type ReceiptKind = 'delivered' | 'read';

type UseReceiptsByMessageIdParams = {
  channel: Channel;
  kind: ReceiptKind;
  messages: LocalMessage[];
  returnAllReadData: boolean;
  lastOwnMessage?: LocalMessage;
};

const snapshotSelector = (next: MessageReceiptsSnapshot) => ({
  deliveredByMessageId: next.deliveredByMessageId,
  readersByMessageId: next.readersByMessageId,
  revision: next.revision,
});

const refOf = (message: LocalMessage): MsgRef => ({
  msgId: message.id,
  timestamp: message.created_at,
});

/**
 * Expands the tracker's cursor buckets into everyone at or past each rendered message. A bucket
 * holds only the users whose cursor stopped on that message, so a message's answer is its bucket
 * plus every newer one. Computed in one reverse pass; a message whose bucket adds nobody reuses the
 * array of the message after it, so allocations scale with the number of readers, not the list
 * length.
 */
const expandBuckets = ({
  buckets,
  messages,
  seed,
}: {
  buckets: Record<string, UserResponse[]>;
  messages: LocalMessage[];
  seed: UserResponse[];
}): Record<string, UserResponse[]> => {
  const result: Record<string, UserResponse[]> = {};
  const seen = new Map<string, UserResponse>(seed.map((user) => [user.id, user]));
  let current = Array.from(seen.values());

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    let grew = false;

    for (const user of buckets[message.id] ?? []) {
      if (seen.has(user.id)) continue;
      seen.set(user.id, user);
      grew = true;
    }

    if (grew) current = Array.from(seen.values());
    result[message.id] = current;
  }

  return result;
};

export const useReceiptsByMessageId = ({
  channel,
  kind,
  lastOwnMessage,
  messages,
  returnAllReadData,
}: UseReceiptsByMessageIdParams): Record<string, UserResponse[]> => {
  const trackerSnapshot = useStateStore(
    channel.messageReceiptsTracker.snapshotStore,
    snapshotSelector,
  );

  return useMemo(() => {
    // Nothing has been published yet, so nobody is past anything.
    if (!trackerSnapshot) return {};

    const tracker = channel.messageReceiptsTracker;
    const usersForMessage = (ref: MsgRef) =>
      kind === 'read' ? tracker.readersForMessage(ref) : tracker.deliveredForMessage(ref);

    if (!returnAllReadData) {
      if (!lastOwnMessage) return {};
      return { [lastOwnMessage.id]: usersForMessage(refOf(lastOwnMessage)) };
    }

    if (!messages.length) return {};

    return expandBuckets({
      buckets:
        kind === 'read'
          ? trackerSnapshot.readersByMessageId
          : trackerSnapshot.deliveredByMessageId,
      messages,
      // Whoever is already past the newest rendered message; the buckets below it do the rest.
      seed: usersForMessage(refOf(messages[messages.length - 1])),
    });
  }, [channel, kind, lastOwnMessage, messages, returnAllReadData, trackerSnapshot]);
};
