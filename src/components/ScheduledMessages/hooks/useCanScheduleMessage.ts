import { useMemo } from 'react';
import type {
  MessageComposer,
  MessageComposerState,
  ScheduledMessagePaginatorsManagerState,
} from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import { useChannelCapabilities } from '../../Channel/hooks/useChannelCapabilities';
import {
  useMessageComposerController,
  useScheduledMessageCompositionState,
} from '../../MessageComposer/hooks';
import { SCHEDULE_MESSAGE_CAPABILITY } from '../constants';

const scheduledMessagesSelector = ({
  isDisabled,
}: ScheduledMessagePaginatorsManagerState) => ({
  isDisabled,
});

const messageComposerSelector = ({ editedMessage }: MessageComposerState) => ({
  editedMessage,
});

const createScheduleBlockReasonSelector = (messageComposer: MessageComposer) => () => ({
  scheduleBlockReason: messageComposer.scheduledMessageComposition.scheduleBlockReason,
});

export const useCanScheduleMessage = () => {
  const { client } = useChatContext();
  const messageComposer = useMessageComposerController();
  const { channel, locationComposer, textComposer } = messageComposer;
  const channelCapabilities = useChannelCapabilities({ cid: channel.cid });

  const { isDisabled } = useStateStore(
    client.scheduledMessagePaginators.state,
    scheduledMessagesSelector,
  );
  const scheduleBlockReasonSelector = useMemo(
    () => createScheduleBlockReasonSelector(messageComposer),
    [messageComposer],
  );

  const { editedMessage } = useStateStore(messageComposer.state, messageComposerSelector);
  const { editedScheduledMessage } = useScheduledMessageCompositionState();
  const isEditing = !!editedMessage || !!editedScheduledMessage;
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
