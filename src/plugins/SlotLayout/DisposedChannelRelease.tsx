import React, { useEffect } from 'react';
import type { Channel, ChannelStateData } from 'stream-chat';

import { useStateStore } from '../../store';
import { useChatViewContext } from './ChatView';
import { useSlotChannels } from './hooks';
import type { SlotName } from './layoutController/layoutControllerTypes';
import { getChatViewEntityBinding } from './slotBinding';

const pendingDisposalSelector = ({ pendingDisposal }: ChannelStateData) => ({
  pendingDisposal,
});

/**
 * Empties `slot` once stream-chat disposes of its channel (`channel.pendingDisposal`): the channel
 * was deleted (`channel.deleted`, `notification.channel_deleted`) or the current user was removed
 * from it (`notification.removed_from_channel`). It no longer receives events, so the slot shows its
 * empty state rather than a channel that is gone. A hidden channel is not disposed of, so it stays.
 */
const ReleaseWhenDisposed = ({ channel, slot }: { channel: Channel; slot: SlotName }) => {
  const { layoutController } = useChatViewContext();
  const { pendingDisposal } = useStateStore(channel.state, pendingDisposalSelector);

  useEffect(() => {
    if (!pendingDisposal) return;
    const { activeView, layouts } = layoutController.state.getLatestValue();
    const bound = getChatViewEntityBinding(layouts?.[activeView]?.slotBindings[slot]);
    // the slot may already show something else
    if (bound?.source !== channel) return;
    layoutController.release(slot);
  }, [channel, layoutController, pendingDisposal, slot]);

  return null;
};

/**
 * Empties every slot whose channel stream-chat disposed of: deleted, or the current user removed
 * from it. Opt-in: mount it once inside `<ChatView>`.
 *
 * ```tsx
 * <ChatView>
 *   <DisposedChannelRelease />
 * </ChatView>
 * ```
 */
export const DisposedChannelRelease = () => (
  <>
    {useSlotChannels().map(({ channel, slot }) => (
      <ReleaseWhenDisposed channel={channel} key={slot} slot={slot} />
    ))}
  </>
);
