import { useMemo } from 'react';
import type { ChannelConfig, Command, MessageComposerState } from 'stream-chat';

import { useStateStore } from '../../../store';
import { useMessageComposerController } from './useMessageComposerController';

const messageComposerStateSelector = ({
  editedMessage,
  quotedMessage,
}: MessageComposerState) => ({
  editedMessage,
  quotedMessage,
});

const channelConfigStateSelector = ({ availableCommands }: ChannelConfig) => ({
  availableCommands,
});

export type MessageComposerCommand = {
  command: Command & { name: string };
  enabled: boolean;
};

export const useMessageComposerCommands = () => {
  const messageComposer = useMessageComposerController();
  const { availableCommands } = useStateStore(
    messageComposer.channel.configState,
    channelConfigStateSelector,
  );
  const { editedMessage, quotedMessage } = useStateStore(
    messageComposer.state,
    messageComposerStateSelector,
  );

  return useMemo<MessageComposerCommand[]>(
    () =>
      (availableCommands ?? [])
        .filter((command): command is Command & { name: string } => !!command.name)
        .map((command) => ({
          command,
          enabled: !messageComposer.isCommandDisabled(command),
        })),
    // editedMessage and quotedMessage are necessary in deps for reactivity
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [availableCommands, editedMessage, messageComposer, quotedMessage],
  );
};
