import clsx from 'clsx';
import React, { useMemo } from 'react';
import type { UserSuggestion } from 'stream-chat';
import { Avatar } from '../../../Avatar';
import { ListItemLayout } from '../../../ListItemLayout';
import type { MentionItemComponentProps } from './types';
import {
  type TokenizedSuggestionDisplayName,
  TokenizedSuggestionParts,
} from '../TokenizedSuggestionParts';

type LegacyUserSuggestionEntity = {
  tokenizedDisplayName: TokenizedSuggestionDisplayName;
  id?: string;
  image?: string;
  mentionType?: 'user';
  name?: string;
};

export type UserItemProps = MentionItemComponentProps<
  LegacyUserSuggestionEntity | UserSuggestion
>;

/**
 * UI component for mentions rendered in suggestion list
 */
export const UserItem = ({ entity, focused, ...buttonProps }: UserItemProps) => {
  const hasEntity = !!Object.keys(entity).length;

  const titleAttribute = entity.name || entity.id || '';
  const LeadingSlot = useMemo(
    () =>
      function UserItemAvatar() {
        return <Avatar imageUrl={entity.image} size='md' userName={titleAttribute} />;
      },
    [entity.image, titleAttribute],
  );

  if (!hasEntity) return null;

  return (
    <ListItemLayout
      contentClassName='str-chat__context-menu__button__label'
      LeadingSlot={LeadingSlot}
      RootElement='button'
      rootProps={{
        ...buttonProps,
        className: clsx(
          'str-chat__context-menu__button',
          'str-chat__user-context-menu__button',
          buttonProps.className,
          'str-chat__suggestion-list__mention',
        ),
        role: buttonProps.role ?? 'menuitem',
        title: titleAttribute,
      }}
      selected={focused}
      title={
        <TokenizedSuggestionParts tokenizedDisplayName={entity.tokenizedDisplayName} />
      }
      titleClassName='str-chat__suggestion-list__mention-item-title'
    />
  );
};
