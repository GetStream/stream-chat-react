import { useMemo } from 'react';
import type { Command, MessageComposerState } from 'stream-chat';

import { useStateStore } from '../../../store';
import { useMessageComposerController } from './useMessageComposerController';

const messageComposerStateSelector = ({
  editedMessage,
  quotedMessage,
}: MessageComposerState) => ({
  editedMessage,
  quotedMessage,
});

export type MessageComposerCommand = {
  command: Command & { name: string };
  enabled: boolean;
};

export const useMessageComposerCommands = () => {
  const messageComposer = useMessageComposerController();
  const channelConfig = messageComposer.channel.getConfig();
  const { editedMessage, quotedMessage } = useStateStore(
    messageComposer.state,
    messageComposerStateSelector,
  );

  return useMemo<MessageComposerCommand[]>(
    () =>
      (channelConfig?.commands ?? [])
        .filter(
          (command): command is Command & { name: string } => !!command.name,
        )
        .map((command) => ({
          command,
          enabled: !messageComposer.isCommandDisabled(command),
        })),
    // editedMessage and quotedMessage are necessary in deps for reactivity
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelConfig, editedMessage, messageComposer, quotedMessage],
  );
};
