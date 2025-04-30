import type { PropsWithChildren } from 'react';
import React from 'react';
import type { CommandResponse } from 'stream-chat';

export type CommandItemProps = {
  entity: CommandResponse;
};

export const CommandItem = (props: PropsWithChildren<CommandItemProps>) => {
  const { entity } = props;

  return (
    <div className='str-chat__slash-command'>
      <span className='str-chat__slash-command-header'>
        <strong>{entity.name}</strong> {entity.args}
      </span>
      <br />
      <span className='str-chat__slash-command-description'>{entity.description}</span>
    </div>
  );
};
