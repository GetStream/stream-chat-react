import type { ComponentProps, PropsWithChildren } from 'react';
import React from 'react';
import type { Command, MessageComposerState } from 'stream-chat';
import { CommandContextMenuItem } from '../../MessageComposer/AttachmentSelector/CommandsMenu';
import { useStateStore } from '../../../store';
import { useMessageComposerController } from '../../MessageComposer/hooks';

export type CommandItemProps = {
  entity: Command;
  enabled?: boolean;
  focused?: boolean;
} & ComponentProps<'button'>;

const messageComposerStateSelector = ({
  editedMessage,
  quotedMessage,
}: MessageComposerState) => ({
  editedMessage,
  quotedMessage,
});

export const CommandItem = (props: PropsWithChildren<CommandItemProps>) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { enabled, entity, focused: _, ...buttonProps } = props;
  const messageComposer = useMessageComposerController();
  useStateStore(messageComposer.state, messageComposerStateSelector);

  if (!entity.name) return null;

  const resolvedEnabled =
    enabled ??
    !messageComposer.isCommandDisabled(entity as Command & { name: string });

  return (
    <CommandContextMenuItem
      {...buttonProps}
      command={entity as Command & { name: string }}
      enabled={resolvedEnabled}
    />
  );
};
