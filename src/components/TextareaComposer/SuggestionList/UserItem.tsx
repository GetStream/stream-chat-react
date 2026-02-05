import type { ComponentProps } from 'react';
import React from 'react';
import clsx from 'clsx';
import { UserContextMenuButton } from '../../Dialog';

export type UserItemProps = {
  /** The user */
  entity: {
    /** The parts of the Name property of the entity (or id if no name) that can be matched to the user input value.
     * Default is bold for matches, but can be overwritten in css.
     * */
    tokenizedDisplayName: { token: string; parts: string[] };
    /** Id of the user */
    id?: string;
    /** Image of the user */
    image?: string;
    /** Name of the user */
    name?: string;
  };
  focused?: boolean;
} & ComponentProps<'button'>;

/**
 * UI component for mentions rendered in suggestion list
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const UserItem = ({ entity, focused: _, ...buttonProps }: UserItemProps) => {
  const hasEntity = !!Object.keys(entity).length;
  if (!hasEntity) return null;

  const { parts, token } = entity.tokenizedDisplayName;
  const renderName = () =>
    parts.map((part, i) => {
      const matches = part.toLowerCase() === token;
      const partWithHTMLSpacesAround = part.replace(/^\s+|\s+$/g, '\u00A0');
      return (
        <span
          className={clsx({
            'str-chat__emoji-item-part': !matches,
            'str-chat__suggestion-item-part--match': matches,
          })}
          key={`part-${i}`}
        >
          {partWithHTMLSpacesAround}
        </span>
      );
    });

  return (
    <UserContextMenuButton
      {...buttonProps}
      imageUrl={entity.image}
      title={entity.name || entity.id}
      userName={entity.name || entity.id}
    >
      {renderName()}
    </UserContextMenuButton>
  );
};
