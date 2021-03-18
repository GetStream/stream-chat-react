import React from 'react';

export type EmoticonItemProps = {
  entity: {
    /** The parts of the Name for the emoticon and the user input value for use in custom styling. Default is bold for matches.*/
    itemNameParts: { match: string; parts: string[] };
    /** Name for emoticon */
    name: string;
    /** Native value or actual emoticon */
    native: string;
  };
};

const UnMemoizedEmoticonItem: React.FC<EmoticonItemProps> = (props) => {
  const { entity } = props;

  const hasEntity = Object.keys(entity).length;
  const itemParts = entity?.itemNameParts;

  const renderName = () => {
    if (!hasEntity) return null;
    return (
      hasEntity &&
      itemParts.parts.map((part, i) =>
        part.toLowerCase() === itemParts.match.toLowerCase() ? (
          <span className='str-chat__emoji-item--highlight' key={`part-${i}`}>
            {part}
          </span>
        ) : (
          <span className='str-chat__emoji-item--part' key={`part-${i}`}>
            {part}
          </span>
        ),
      )
    );
  };

  return (
    <div className='str-chat__emoji-item'>
      <span className='str-chat__emoji-item--entity'>{entity.native}</span>
      <span className='str-chat__emoji-item--name'>{renderName()}</span>
    </div>
  );
};

export const EmoticonItem = React.memo(
  UnMemoizedEmoticonItem,
) as typeof UnMemoizedEmoticonItem;
