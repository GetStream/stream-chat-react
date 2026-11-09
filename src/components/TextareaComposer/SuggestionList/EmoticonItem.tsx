import clsx from 'clsx';
import type { ComponentProps } from 'react';
import React from 'react';
import { EmojiContextMenuButton } from '../../Dialog';

export type EmoticonItemProps = {
  entity: {
    name: string;
    /** The emoji character. */
    native: string;
    /**
     * Parts of the entity's name (or ID when it has none) split around the user input. Parts that
     * match get the `str-chat__emoji-item--highlight` class.
     */
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
