import clsx from 'clsx';
import type { ComponentProps } from 'react';
import React from 'react';
import type { UserSuggestion } from 'stream-chat';
import {
  type TokenizedSuggestionDisplayName,
  TokenizedSuggestionParts,
} from './TokenizedSuggestionParts';
import { SuggestionItemWithAvatar } from './SuggestionItemWithAvatar';

type LegacyUserSuggestionEntity = {
  tokenizedDisplayName: TokenizedSuggestionDisplayName;
  id?: string;
  image?: string;
  mentionType?: 'user';
  name?: string;
};

export type UserItemProps = {
  /** The user suggestion entity */
  entity: LegacyUserSuggestionEntity | UserSuggestion;
  focused?: boolean;
} & ComponentProps<'button'>;

/**
 * UI component for mentions rendered in suggestion list
 */
export const UserItem = ({
  className,
  entity,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  focused: _,
  ...buttonProps
}: UserItemProps) => {
  const hasEntity = !!Object.keys(entity).length;
  if (!hasEntity) return null;

  const title = entity.name || entity.id || '';

  return (
    <SuggestionItemWithAvatar
      {...buttonProps}
      avatarImageUrl={entity.image}
      avatarName={title}
      className={clsx('str-chat__user-context-menu__button', className)}
      decorativeAvatar={false}
      title={title}
      titleClassName='str-chat__context-menu__button__label'
      useSuggestionLayoutClasses={false}
    >
      <TokenizedSuggestionParts tokenizedDisplayName={entity.tokenizedDisplayName} />
    </SuggestionItemWithAvatar>
  );
};
