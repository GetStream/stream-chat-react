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
// a channel created from members adopts its real cid in the query that also sets `initialized`
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
 * A channel created from members is bound under its temporary cid until its first query gives it
 * the real one. The slot is then bound again to the same instance under the real cid, so lookups by
 * cid (the active row in a channel list, closing the channel) and the URL find it.
 *
 * It also moves a slot from a superseded channel to the instance that replaced it (`channel.supersededBy`):
 * a channel created without an id whose cid, once the server answered, another instance already
 * held. stream-chat has moved the conversation to that instance; this moves the screen.
 *
 * The swap happens right away, except when the replacing instance is open in another slot and this
 * one's composer still holds something: stream-chat moves a composer only into one nobody is using,
 * so the slot stays until its composer is empty, typically once its message is sent.
 */
export const SupersededChannelSwap = ({
  bindingKey,
  channel,
  layoutController,
  slot,
}: {
  /** The key the slot's binding currently has. */
  bindingKey?: string;
  channel: StreamChannel;
  layoutController: LayoutController;
  slot: SlotName;
}) => {
  // a slot source without channel state (a stand-in object) never swaps
  const { supersededBy } = useStateStore(channel.state, supersededBySelector) ?? {};
  const successorActive =
    useStateStore(supersededBy?.state, activeSelector)?.active ?? false;
  // re-rendered on every composer change, so the emptiness read below stays current
  useStateStore(channel.messageComposer?.editingAuditState, editingAuditStateSelector);
  const composerIsEmpty = channel.messageComposer?.compositionIsEmpty ?? true;
  // re-rendered when the query that gives a channel created from members its real cid completes
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
