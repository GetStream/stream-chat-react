import type { ComponentProps, PropsWithChildren } from 'react';
import React from 'react';
import type { CommandResponse } from 'stream-chat';
import { CommandContextMenuItem } from '../../MessageInput/AttachmentSelector/CommandsMenu';

export type CommandItemProps = {
  entity: CommandResponse;
  focused?: boolean;
} & ComponentProps<'button'>;

export const CommandItem = (props: PropsWithChildren<CommandItemProps>) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { entity, focused: _, ...buttonProps } = props;

  if (!entity.name) return null;

  return (
    <CommandContextMenuItem
      {...buttonProps}
      command={entity as CommandResponse & { name: string }}
    />
  );
};
