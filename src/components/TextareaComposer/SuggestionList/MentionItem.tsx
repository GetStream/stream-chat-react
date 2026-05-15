import type { ComponentProps } from 'react';
import React from 'react';
import type { MentionSuggestion } from 'stream-chat';
import { RoleItem, type RoleItemProps } from './RoleItem';
import { SpecialMentionItem, type SpecialMentionItemProps } from './SpecialMentionItem';
import { UserGroupItem, type UserGroupItemProps } from './UserGroupItem';
import { UserItem, type UserItemProps } from './UserItem';

export type MentionItemProps = {
  entity: MentionSuggestion;
  focused?: boolean;
  RoleItemComponent?: React.ComponentType<RoleItemProps>;
  SpecialMentionItemComponent?: React.ComponentType<SpecialMentionItemProps>;
  UserGroupItemComponent?: React.ComponentType<UserGroupItemProps>;
  UserItemComponent?: React.ComponentType<UserItemProps>;
} & ComponentProps<'button'>;

export const MentionItem = ({
  entity,
  focused,
  RoleItemComponent = RoleItem,
  SpecialMentionItemComponent = SpecialMentionItem,
  UserGroupItemComponent = UserGroupItem,
  UserItemComponent = UserItem,
  ...buttonProps
}: MentionItemProps) => {
  if (entity.mentionType === 'user') {
    return <UserItemComponent {...buttonProps} entity={entity} focused={focused} />;
  }

  if (entity.mentionType === 'role') {
    return <RoleItemComponent {...buttonProps} entity={entity} focused={focused} />;
  }

  if (entity.mentionType === 'user_group') {
    return <UserGroupItemComponent {...buttonProps} entity={entity} focused={focused} />;
  }

  return (
    <SpecialMentionItemComponent {...buttonProps} entity={entity} focused={focused} />
  );
};
