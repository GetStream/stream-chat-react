import clsx from 'clsx';
import type { ComponentProps } from 'react';
import React from 'react';
import { EmojiContextMenuButton } from '../../Dialog';

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
  focused?: boolean;
} & ComponentProps<'button'>;

export const EmoticonItem = (props: EmoticonItemProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { className, entity, focused: _, ...buttonProps } = props;
  const hasEntity = Object.keys(entity).length;
  if (!hasEntity) return null;

  const { parts, token } = entity.tokenizedDisplayName ?? ({} as EmoticonItemProps);

  return (
    <EmojiContextMenuButton
      {...buttonProps}
      className={clsx('str-chat__emoji-item', className)}
      emoji={entity.native}
    >
      {parts?.map((part, i) =>
        part.toLowerCase() === token ? (
          <span className='str-chat__emoji-item--highlight' key={`part-${i}`}>
            {part}
          </span>
        ) : (
          <span className='str-chat__emoji-item--part' key={`part-${i}`}>
            {part}
          </span>
        ),
      ) ?? null}
    </EmojiContextMenuButton>
  );
};
