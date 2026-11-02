import { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';
import {
  restoreLayoutState,
  serializeLayoutState,
  useChatViewContext,
} from 'stream-chat-react/slot-layout';
import type { ChatViewLayoutSnapshot } from 'stream-chat-react/slot-layout';
import { createDeserializer, serializeEntityBinding } from './layoutSnapshot';

export const LayoutPersistence = () => {
  const { client } = useChatContext();
  const { layoutController } = useChatViewContext();

  useEffect(() => {
    // One layout per user. Change the version when you change the app's layouts.
    const storageKey = `chat-layout:v1:${client.userId}`;

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const snapshot = JSON.parse(saved) as ChatViewLayoutSnapshot;
      layoutController.state.next(
        restoreLayoutState(snapshot, {
          deserializeEntityBinding: createDeserializer(client),
        }),
      );
    }

    // Called once now, then after every change.
    return layoutController.state.subscribe((state) => {
      const snapshot = serializeLayoutState(state, { serializeEntityBinding });
      localStorage.setItem(storageKey, JSON.stringify(snapshot));
    });
  }, [client, layoutController]);

  return null;
};
