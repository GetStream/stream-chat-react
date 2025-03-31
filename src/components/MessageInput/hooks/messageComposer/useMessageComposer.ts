import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageComposer } from 'stream-chat';
import { useThreadContext } from '../../../Threads';
import { useChannelStateContext, useMessageInputContext } from '../../../../context';
import type { LocalMessage } from 'stream-chat';
import { useLegacyThreadContext } from '../../../Thread';

class FixedSizeQueueCache<K, T> {
  private keys: Array<K>;
  private size: number;
  private valueByKey: Map<K, T>;
  constructor(size: number) {
    if (!size) throw new Error('Size must be greater than 0');
    this.keys = [];
    this.size = size;
    this.valueByKey = new Map();
  }

  add(key: K, value: T) {
    const index = this.keys.indexOf(key);

    if (index > -1) {
      this.keys.splice(this.keys.indexOf(key), 1);
    } else if (this.keys.length >= this.size) {
      const elementKey = this.keys.shift();

      if (elementKey) {
        this.valueByKey.delete(elementKey);
      }
    }

    this.keys.push(key);
    this.valueByKey.set(key, value);
  }

  peek(key: K) {
    const value = this.valueByKey.get(key);

    return value;
  }

  get(key: K) {
    const foundElement = this.peek(key);

    if (foundElement && this.keys.indexOf(key) !== this.size - 1) {
      this.keys.splice(this.keys.indexOf(key), 1);
      this.keys.push(key);
    }

    return foundElement;
  }
}

export type UseMessageComposerParams = unknown;

const queueCache = new FixedSizeQueueCache<string, MessageComposer>(64);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useMessageComposer = (_unused: UseMessageComposerParams = {}) => {
  const { channel } = useChannelStateContext();
  const { message: editedMessage } = useMessageInputContext();
  // legacy thread will receive new composer
  const { legacyThread: parentMessage, messageDraft } = useLegacyThreadContext();
  const threadInstance = useThreadContext();
  const detachedMessageComposerRef = useRef<MessageComposer>(
    new MessageComposer({ channel, tag: 'detached' }),
  );

  const [cachedEditedMessage, setCachedEditedMessage] = useState<
    LocalMessage | undefined
  >(editedMessage);
  const [cachedParentMessage, setCachedParentMessage] = useState<
    LocalMessage | undefined
  >(parentMessage ?? undefined);

  if (editedMessage?.id !== cachedEditedMessage?.id) {
    setCachedEditedMessage(editedMessage);
  }

  if (parentMessage?.id !== cachedParentMessage?.id) {
    setCachedParentMessage(parentMessage ?? undefined);
  }

  // composer hierarchy
  // edited message (always new) -> thread instance (own) -> thread message (always new) -> channel (own)
  // editedMessage ?? thread ?? parentMessage ?? channel;
  const messageComposer = useMemo(() => {
    if (cachedEditedMessage) {
      const tag = `edited-message-${cachedEditedMessage.id}`;

      const element = queueCache.get(tag);
      if (element) return element;

      const c = new MessageComposer({
        channel,
        composition: cachedEditedMessage,
        tag,
      });

      return c;
    } else if (threadInstance) {
      return threadInstance.messageComposer;
    } else if (cachedParentMessage) {
      const tag = `parent-message-${cachedParentMessage.id}`;

      const element = queueCache.get(tag);
      if (element) return element;

      const c = new MessageComposer({
        channel,
        composition: messageDraft,
        tag,
        threadId: cachedParentMessage.id,
      });

      return c;
    } else if (channel) {
      return channel.messageComposer;
    } else {
      // should never reach this point
      return detachedMessageComposerRef.current;
    }
  }, [
    cachedEditedMessage,
    cachedParentMessage,
    channel,
    messageDraft, // TODO: set message draft after the fact
    threadInstance,
  ]);

  if (!queueCache.peek(messageComposer.tag)) {
    queueCache.add(messageComposer.tag, messageComposer);
  }

  useEffect(() => {
    const unsubscribe = messageComposer.registerSubscriptions();
    return () => {
      unsubscribe();
    };
  }, [messageComposer]);

  return messageComposer;
};
