import { useMemo } from 'react';
import type {
  MessageComposerState,
  ScheduledMessagePaginatorsManagerState,
} from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import { useChannelCapabilities } from '../../Channel/hooks/useChannelCapabilities';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { isComposerEditing } from '../utils';

export const SCHEDULE_MESSAGE_CAPABILITY = 'schedule-message';

const selectIsDisabled = ({ isDisabled }: ScheduledMessagePaginatorsManagerState) => ({
  isDisabled,
});

const selectIsEditing = (state: MessageComposerState) => ({
  isEditing: isComposerEditing(state),
});

/**
 * Whether the composition can be scheduled: the channel allows it, the feature is on, nothing is
 * being edited and the composition holds nothing that cannot be scheduled (a command, a poll, a
 * location). `scheduleBlockReason` reads three stores, so each is subscribed to.
 */
export const useCanScheduleMessage = () => {
  const { client } = useChatContext();
  const messageComposer = useMessageComposerController();
  const { channel, locationComposer, textComposer } = messageComposer;
  const channelCapabilities = useChannelCapabilities({ cid: channel.cid });

  const selectBlockReason = useMemo(
    () => () => ({ scheduleBlockReason: messageComposer.scheduleBlockReason }),
    [messageComposer],
  );

  const { isDisabled } = useStateStore(
    client.scheduledMessagePaginators.state,
    selectIsDisabled,
  );
  const { isEditing } = useStateStore(messageComposer.state, selectIsEditing);
  const blockReasons = [
    useStateStore(messageComposer.state, selectBlockReason).scheduleBlockReason,
    useStateStore(textComposer.state, selectBlockReason).scheduleBlockReason,
    useStateStore(locationComposer.state, selectBlockReason).scheduleBlockReason,
  ];

  return (
    channelCapabilities.has(SCHEDULE_MESSAGE_CAPABILITY) &&
    !isDisabled &&
    !isEditing &&
    !blockReasons.some(Boolean)
  );
};
