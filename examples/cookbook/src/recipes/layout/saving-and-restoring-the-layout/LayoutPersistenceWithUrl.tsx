import { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';
import {
  createChatViewSlotBinding,
  getChatViewEntityBinding,
  getLayoutViewState,
  restoreLayoutState,
  serializeLayoutState,
  useChatViewContext,
} from 'stream-chat-react/slot-layout';
import type {
  ChatViewLayoutSnapshot,
  ChatViewLayoutState,
} from 'stream-chat-react/slot-layout';
import {
  channelFromCid,
  createDeserializer,
  serializeEntityBinding,
} from './layoutSnapshot';

const URL_PARAM = 'channel';

// The cid of the channel in the channels view's 'channel' slot.
const cidInChannelSlot = (state: ChatViewLayoutState) => {
  const entity = getChatViewEntityBinding(
    getLayoutViewState(state, 'channels').slotBindings.channel,
  );
  return entity?.kind === 'channel' ? entity.source.cid : undefined;
};

// Puts the cid in the URL, or takes it out, without adding a history entry.
const writeCidToUrl = (cid: string | undefined) => {
  const url = new URL(window.location.href);
  if ((url.searchParams.get(URL_PARAM) ?? undefined) === cid) return;
  if (cid) url.searchParams.set(URL_PARAM, cid);
  else url.searchParams.delete(URL_PARAM);
  window.history.replaceState(window.history.state, '', url);
};

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

    // A link to a channel other than the restored one opens that channel.
    const cidInUrl = new URLSearchParams(window.location.search).get(URL_PARAM);
    const linkedChannel = cidInUrl ? channelFromCid(client, cidInUrl) : undefined;
    if (
      linkedChannel &&
      linkedChannel.cid !== cidInChannelSlot(layoutController.state.getLatestValue())
    ) {
      layoutController.setActiveView('channels');
      layoutController.bind(
        'channel',
        createChatViewSlotBinding({
          key: linkedChannel.cid,
          kind: 'channel',
          source: linkedChannel,
        }),
      );
    }

    // Called once now, then after every change.
    return layoutController.state.subscribe((state) => {
      const snapshot = serializeLayoutState(state, { serializeEntityBinding });
      localStorage.setItem(storageKey, JSON.stringify(snapshot));
      writeCidToUrl(cidInChannelSlot(state));
    });
  }, [client, layoutController]);

  return null;
};
