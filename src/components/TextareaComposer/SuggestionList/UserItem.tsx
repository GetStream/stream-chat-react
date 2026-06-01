import clsx from 'clsx';
import type { ComponentProps } from 'react';
import React from 'react';
import { useMemo } from 'react';
import type { UserSuggestion } from 'stream-chat';
import { Avatar } from '../../Avatar';
import { ListItemLayout } from '../../ListItemLayout/ListItemLayout';
import {
  type TokenizedSuggestionDisplayName,
  TokenizedSuggestionParts,
} from './TokenizedSuggestionParts';

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

  const titleAttribute = entity.name || entity.id || '';
  const LeadingSlot = useMemo(
    () =>
      function UserItemAvatar() {
        return <Avatar imageUrl={entity.image} size='md' userName={titleAttribute} />;
      },
    [entity.image, titleAttribute],
  );

  const title = useMemo(
    () => <TokenizedSuggestionParts tokenizedDisplayName={entity.tokenizedDisplayName} />,
    [entity.tokenizedDisplayName],
  );
  const rootProps = useMemo<ComponentProps<'button'>>(
    () => ({
      ...buttonProps,
      className: clsx(
        'str-chat__context-menu__button',
        'str-chat__user-context-menu__button',
        className,
      ),
      role: buttonProps.role ?? 'menuitem',
      title: titleAttribute,
    }),
    [buttonProps, className, titleAttribute],
  );

  if (!hasEntity) return null;

  return (
    <ListItemLayout
      contentClassName='str-chat__context-menu__button__label'
      LeadingSlot={LeadingSlot}
      RootElement='button'
      rootProps={rootProps}
      title={title}
      titleClassName='str-chat__suggestion-list__mention-item-title'
    />
  );
};
