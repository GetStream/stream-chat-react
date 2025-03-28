import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageComposer } from 'stream-chat';
import { useThreadContext } from '../../../Threads';
import { useChannelStateContext, useMessageInputContext } from '../../../../context';
import type { LocalMessage } from 'stream-chat';
import { useLegacyThreadContext } from '../../../Thread';

class FixedSizeQueueCache<T> {
  private elements: Array<T>;
  private size: number;
  constructor(size: number) {
    if (!size) throw new Error('Size must be greater than 0');
    this.elements = [];
    this.size = size;
  }

  add(...values: T[]) {
    const pushableValues =
      values.length > this.size ? values.slice(values.length - this.size) : values;

    if (pushableValues.length === this.size) {
      // this.elements.splice(0, this.size - 1);
      this.elements.length = 0;
      this.elements.push(...pushableValues);
    } else {
      for (const value of pushableValues) {
        if (this.elements.length >= this.size) {
          this.elements.shift();
        }

        this.elements.push(value);
      }
    }
  }

  // returns value without shifting it to the end of the array
  peek(predicate: (element: T) => boolean) {
    // start searching from the most recent (end of array)
    for (let index = 0; index < this.elements.length; index++) {
      const element = this.elements[this.elements.length - 1 - index];
      const predicateResult = predicate(element);

      if (predicateResult) return element;
    }

    return null;
  }

  get(predicate: (element: T) => boolean) {
    const foundElement = this.peek(predicate);

    if (foundElement && this.elements.indexOf(foundElement) !== this.size - 1) {
      this.elements.splice(this.elements.indexOf(foundElement), 1);
      this.elements.push(foundElement);
    }

    return foundElement;
  }

  toArray() {
    return [...this.elements];
  }
}

export type UseMessageComposerParams = unknown;

const queueCache = new FixedSizeQueueCache<MessageComposer>(64);
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

      const element = queueCache.get((element) => element.tag === tag);
      if (element) return element;

      const c = new MessageComposer({
        channel,
        composition: cachedEditedMessage,
        tag,
      });

      // FIXME: don't like this side effect here
      queueCache.add(c);
      return c;
    } else if (threadInstance) {
      return threadInstance.messageComposer;
    } else if (cachedParentMessage) {
      const tag = `parent-message-${cachedParentMessage.id}`;

      const element = queueCache.get((element) => element.tag === tag);
      if (element) return element;

      const c = new MessageComposer({
        channel,
        composition: messageDraft,
        tag,
        threadId: cachedParentMessage.id,
      });

      queueCache.add(c);
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

  useEffect(() => {
    messageComposer.registerSubscriptions();
    return () => {
      messageComposer.unregisterSubscriptions();
    };
  }, [messageComposer]);

  return messageComposer;
};
