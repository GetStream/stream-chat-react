import { useMemo } from 'react';
import type {
  Channel,
  LocationComposerState,
  MessageComposerState,
  ScheduledMessageManagerState,
  TextComposerState,
} from 'stream-chat';

import { useChannelStateContext, useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { SCHEDULE_MESSAGE_CAPABILITY } from '../constants';

const COMMAND_PATTERN = /^\/(\S+)/;

const startsWithChannelCommand = (text: string, channel: Channel) => {
  const [, commandName] = text.match(COMMAND_PATTERN) ?? [];

  if (!commandName) return false;

  const commands = channel.getConfig()?.commands ?? [];

  const isChannelCommand = commands.some(
    ({ name }) => name?.toLowerCase() === commandName.toLowerCase(),
  );

  return isChannelCommand;
};

const scheduledMessagesSelector = ({ isDisabled }: ScheduledMessageManagerState) => ({
  isDisabled,
});

const messageComposerSelector = ({ editedMessage, pollId }: MessageComposerState) => ({
  hasPoll: !!pollId,
  isEditingSentMessage: !!editedMessage,
});

const locationComposerSelector = ({ location }: LocationComposerState) => ({
  hasLocation: !!location,
});

const createTextComposerSelector =
  (channel: Channel) =>
  ({ command, text }: TextComposerState) => ({
    hasCommand: !!command || startsWithChannelCommand(text, channel),
  });

export const useCanScheduleMessage = () => {
  const { client } = useChatContext('useCanScheduleMessage');
  const { channelCapabilities } = useChannelStateContext('useCanScheduleMessage');
  const messageComposer = useMessageComposerController();
  const { channel, locationComposer, textComposer } = messageComposer;

  const textComposerSelector = useMemo(
    () => createTextComposerSelector(channel),
    [channel],
  );

  const { isDisabled } = useStateStore(
    client.scheduledMessages.state,
    scheduledMessagesSelector,
  );
  const { hasPoll, isEditingSentMessage } = useStateStore(
    messageComposer.state,
    messageComposerSelector,
  );
  const { hasCommand } = useStateStore(textComposer.state, textComposerSelector);
  const { hasLocation } = useStateStore(locationComposer.state, locationComposerSelector);

  const hasCapability = !!channelCapabilities[SCHEDULE_MESSAGE_CAPABILITY];
  const compositionCanBeScheduled = !hasCommand && !hasPoll && !hasLocation;

  const canScheduleMessage =
    hasCapability && !isDisabled && !isEditingSentMessage && compositionCanBeScheduled;

  return canScheduleMessage;
};
