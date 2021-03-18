import React from 'react';

export type EmoticonItemProps = {
  entity: {
    /** Name for emoticon */
    name: string;
    /** Native value or actual emoticon */
    native: string;
    /** The parts of the Name for the emoticon and the user input value for use in custom styling. Default is bold for matches.*/
    itemNameParts: { parts: string[]; inputValue: string };
  };
};

const UnMemoizedEmoticonItem: React.FC<EmoticonItemProps> = (props) => {
  const { entity } = props;

  const items = entity.itemNameParts;

  return (
    <div className='str-chat__emoji-item'>
      <span className='str-chat__emoji-item--entity'>{entity.native}</span>
      <span className='str-chat__emoji-item--name'>
        {items.parts.map((part, i) => 
          <span className='str-chat__emoji-item--part'key={i} style={part.toLowerCase() === items.inputValue.toLowerCase() ? { fontWeight: 'bold' } : {} }>
            { part }
          </span>)
        }
      </span>
    </div>
  );
};

export const EmoticonItem = React.memo(
  UnMemoizedEmoticonItem,
) as typeof UnMemoizedEmoticonItem;
