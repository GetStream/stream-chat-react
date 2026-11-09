import { useEffect } from 'react';
import type {
  ChannelStateData,
  EditingAuditState,
  Channel as StreamChannel,
} from 'stream-chat';

import { useStateStore } from '../../store';
import { createChatViewSlotBinding, getChatViewEntityBinding } from './slotBinding';
import type {
  LayoutController,
  SlotName,
} from './layoutController/layoutControllerTypes';

const supersededBySelector = ({ supersededBy }: ChannelStateData) => ({ supersededBy });
// A channel created from members adopts its real cid in the query that also sets `initialized`.
const initializedSelector = ({ initialized }: ChannelStateData) => ({ initialized });
const activeSelector = ({ active }: ChannelStateData) => ({ active });
const editingAuditStateSelector = (state: EditingAuditState) => state;

// Whether the slot still shows this channel. Read when an effect runs, not at render: the slot may
// have been bound to something else in between, and that newer binding must not be replaced.
const slotShowsChannel = (
  layoutController: LayoutController,
  slot: SlotName,
  channel: StreamChannel,
) => {
  const { activeView, layouts } = layoutController.state.getLatestValue();
  const bound = getChatViewEntityBinding(layouts?.[activeView]?.slotBindings[slot]);
  return bound?.kind === 'channel' && bound.source === channel;
};

/**
 * Keeps a slot's binding on its channel's current instance and cid.
 *
 * A channel created from members is bound under a temporary cid until its first query gives it the
 * real one; the slot is then rebound to the same instance under the real cid, so lookups by cid
 * find it. A channel superseded by another instance (`channel.supersededBy`) is swapped for that
 * instance, except while the successor is open in another slot and this channel's composer is not
 * empty: stream-chat moves a composer only into a channel nobody is using.
 */
export const SupersededChannelSwap = ({
  bindingKey,
  channel,
  layoutController,
  slot,
}: {
  bindingKey?: string;
  channel: StreamChannel;
  layoutController: LayoutController;
  slot: SlotName;
}) => {
  // A slot source without channel state (a stand-in object) never swaps.
  const { supersededBy } = useStateStore(channel.state, supersededBySelector) ?? {};
  const successorActive =
    useStateStore(supersededBy?.state, activeSelector)?.active ?? false;
  // Re-renders on every composer change, so the emptiness read below stays current.
  useStateStore(channel.messageComposer?.editingAuditState, editingAuditStateSelector);
  const composerIsEmpty = channel.messageComposer?.compositionIsEmpty ?? true;
  // Re-renders when the query that gives a channel created from members its real cid completes.
  useStateStore(channel.state, initializedSelector);
  const cid = channel.cid;

  useEffect(() => {
    if (supersededBy || !cid || bindingKey === undefined || bindingKey === cid) return;
    if (!slotShowsChannel(layoutController, slot, channel)) return;
    layoutController.bind(
      slot,
      createChatViewSlotBinding({ key: cid, kind: 'channel', source: channel }),
    );
  }, [bindingKey, channel, cid, layoutController, slot, supersededBy]);

  useEffect(() => {
    if (!supersededBy) return;
    if (successorActive && !composerIsEmpty) return;
    if (!slotShowsChannel(layoutController, slot, channel)) return;
    layoutController.bind(
      slot,
      createChatViewSlotBinding({
        key: supersededBy.cid,
        kind: 'channel',
        source: supersededBy,
      }),
    );
  }, [channel, composerIsEmpty, layoutController, slot, successorActive, supersededBy]);

  return null;
};
