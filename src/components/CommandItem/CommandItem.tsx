import React, { PropsWithChildren } from 'react';

export type CommandItemProps = {
  entity: {
    /** Arguments of command */
    args?: string;
    /** Description of command */
    description?: string;
    /** Name of the command */
    name?: string;
  };
};

const UnMemoizedCommandItem = (props: PropsWithChildren<CommandItemProps>) => {
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

export const CommandItem = React.memo(UnMemoizedCommandItem) as typeof UnMemoizedCommandItem;
