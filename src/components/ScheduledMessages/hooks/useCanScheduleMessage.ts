import { useEffect, useState } from 'react';
import type {
  MessageComposer,
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
 * `messageComposer.scheduleBlockReason`, kept current. The rule reads the composer, its text and
 * location composers, and the channel's config and capabilities, so a change to any of them
 * recomputes it.
 */
const useScheduleBlockReason = (messageComposer: MessageComposer) => {
  const [blockReason, setBlockReason] = useState(
    () => messageComposer.scheduleBlockReason,
  );

  useEffect(() => {
    const { channel, locationComposer, textComposer } = messageComposer;
    const update = () => setBlockReason(messageComposer.scheduleBlockReason);
    const unsubscribes = [
      messageComposer.state,
      textComposer.state,
      locationComposer.state,
      channel.state,
      channel.configState,
    ].map((store) => store.subscribe(update));
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [messageComposer]);

  return blockReason;
};

/**
 * Whether the composition can be scheduled: the channel allows it, the feature is on, nothing is
 * being edited and the composition holds nothing that cannot be scheduled (a command or a location).
 */
export const useCanScheduleMessage = () => {
  const { client } = useChatContext();
  const messageComposer = useMessageComposerController();
  const channelCapabilities = useChannelCapabilities({
    cid: messageComposer.channel.cid,
  });

  const { isDisabled } = useStateStore(
    client.scheduledMessagePaginators.state,
    selectIsDisabled,
  );
  const { isEditing } = useStateStore(messageComposer.state, selectIsEditing);
  const blockReason = useScheduleBlockReason(messageComposer);

  return (
    channelCapabilities.has(SCHEDULE_MESSAGE_CAPABILITY) &&
    !isDisabled &&
    !isEditing &&
    !blockReason
  );
};
