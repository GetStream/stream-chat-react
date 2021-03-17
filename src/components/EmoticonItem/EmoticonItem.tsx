import React from 'react';

export type EmoticonItemProps = {
  entity: {
    /** Name for emoticon */
    name: string;
    /** Native value or actual emoticon */
    native: string;
  };
};

const UnMemoizedEmoticonItem: React.FC<EmoticonItemProps> = (props) => {
  const { entity } = props;

  return (
    <div className='str-chat__emoji-item'>
      <span className='str-chat__emoji-item--entity'>{entity.native}</span>
      <span className='str-chat__emoji-item--name'>{entity.name}</span>
    </div>
  );
};

export const EmoticonItem = React.memo(
  UnMemoizedEmoticonItem,
) as typeof UnMemoizedEmoticonItem;
