import { useEffect } from 'react';
import type {
  ChannelStateData,
  EditingAuditState,
  Channel as StreamChannel,
} from 'stream-chat';

import { useStateStore } from '../../store';
import { createChatViewSlotBinding } from './slotBinding';
import type {
  LayoutController,
  SlotName,
} from './layoutController/layoutControllerTypes';

const supersededBySelector = ({ supersededBy }: ChannelStateData) => ({ supersededBy });
const activeSelector = ({ active }: ChannelStateData) => ({ active });
const editingAuditStateSelector = (state: EditingAuditState) => state;

/**
 * Moves a slot from a superseded channel to the instance that replaced it (`channel.supersededBy`):
 * a channel created without an id whose cid, once the server answered, another instance already
 * held. stream-chat has moved the conversation to that instance; this moves the screen.
 *
 * The swap happens right away, except when the replacing instance is open in another slot and this
 * one's composer still holds something: stream-chat moves a composer only into one nobody is using,
 * so the slot stays until its composer is empty, typically once its message is sent.
 */
export const SupersededChannelSwap = ({
  channel,
  layoutController,
  slot,
}: {
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

  useEffect(() => {
    if (!supersededBy) return;
    if (successorActive && !composerIsEmpty) return;
    layoutController.bind(
      slot,
      createChatViewSlotBinding({
        key: supersededBy.cid,
        kind: 'channel',
        source: supersededBy,
      }),
    );
  }, [composerIsEmpty, layoutController, slot, successorActive, supersededBy]);

  return null;
};
