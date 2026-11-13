import { useMemo } from 'react';
import type {
  MessageComposer,
  MessageComposerState,
  ScheduledMessageManagerState,
} from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import { useChannelCapabilities } from '../../Channel/hooks/useChannelCapabilities';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { SCHEDULE_MESSAGE_CAPABILITY } from '../constants';

const scheduledMessagesSelector = ({ isDisabled }: ScheduledMessageManagerState) => ({
  isDisabled,
});

const messageComposerSelector = ({
  editedMessage,
  editedScheduledMessage,
}: MessageComposerState) => ({
  isEditing: !!editedMessage || !!editedScheduledMessage,
});

const createScheduleBlockReasonSelector = (messageComposer: MessageComposer) => () => ({
  scheduleBlockReason: messageComposer.scheduleBlockReason,
});

export const useCanScheduleMessage = () => {
  const { client } = useChatContext();
  const messageComposer = useMessageComposerController();
  const { channel, locationComposer, textComposer } = messageComposer;
  const channelCapabilities = useChannelCapabilities({ cid: channel.cid });

  const { isDisabled } = useStateStore(
    client.scheduledMessages.state,
    scheduledMessagesSelector,
  );
  const scheduleBlockReasonSelector = useMemo(
    () => createScheduleBlockReasonSelector(messageComposer),
    [messageComposer],
  );

  const { isEditing } = useStateStore(messageComposer.state, messageComposerSelector);
  const { scheduleBlockReason: blockReasonFromComposer } = useStateStore(
    messageComposer.state,
    scheduleBlockReasonSelector,
  );
  const { scheduleBlockReason: blockReasonFromText } = useStateStore(
    textComposer.state,
    scheduleBlockReasonSelector,
  );
  const { scheduleBlockReason: blockReasonFromLocation } = useStateStore(
    locationComposer.state,
    scheduleBlockReasonSelector,
  );

  const hasCapability = channelCapabilities.has(SCHEDULE_MESSAGE_CAPABILITY);
  const compositionCanBeScheduled =
    !blockReasonFromComposer && !blockReasonFromText && !blockReasonFromLocation;

  const canScheduleMessage =
    hasCapability && !isDisabled && !isEditing && compositionCanBeScheduled;

  return canScheduleMessage;
};
