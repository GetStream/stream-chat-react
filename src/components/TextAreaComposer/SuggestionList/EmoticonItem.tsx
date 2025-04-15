import React from 'react';

export type EmoticonItemProps = {
  entity: {
    /** Name for emoticon */
    name: string;
    /** Native value or actual emoticon */
    native: string;
    /** The parts of the Name property of the entity (or id if no name) that can be matched to the user input value.
     * Default is bold for matches, but can be overwritten in css.
     * */
    tokenizedDisplayName: { token: string; parts: string[] };
  };
};

export const EmoticonItem = (props: EmoticonItemProps) => {
  const { entity } = props;
  const hasEntity = Object.keys(entity).length;
  if (!hasEntity) return null;

  const { parts, token } = entity.tokenizedDisplayName ?? ({} as EmoticonItemProps);

  const renderName = () =>
    parts?.map((part, i) =>
      part.toLowerCase() === token ? (
        <span className='str-chat__emoji-item--highlight' key={`part-${i}`}>
          {part}
        </span>
      ) : (
        <span className='str-chat__emoji-item--part' key={`part-${i}`}>
          {part}
        </span>
      ),
    ) ?? null;

  return (
    <div className='str-chat__emoji-item'>
      <span className='str-chat__emoji-item--entity'>{entity.native}</span>
      <span className='str-chat__emoji-item--name'>{renderName()}</span>
    </div>
  );
};
