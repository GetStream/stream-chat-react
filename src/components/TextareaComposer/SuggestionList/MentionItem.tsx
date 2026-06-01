import type { ComponentProps } from 'react';
import React from 'react';
import type { MentionSuggestion } from 'stream-chat';
import {
  type BroadcastMentionItemProps,
  BroadcastMentionItem as DefaultBroadcastMentionItem,
} from './BroadcastMentionItem';
import { RoleItem as DefaultRoleItem, type RoleItemProps } from './RoleItem';
import {
  SpecialMentionItem as DefaultSpecialMentionItem,
  type SpecialMentionItemProps,
} from './SpecialMentionItem';
import {
  UserGroupItem as DefaultUserGroupItem,
  type UserGroupItemProps,
} from './UserGroupItem';
import { UserItem as DefaultUserItem, type UserItemProps } from './UserItem';

export type MentionItemProps = {
  BroadcastMentionItem?: React.ComponentType<BroadcastMentionItemProps>;
  entity: MentionSuggestion;
  focused?: boolean;
  RoleItem?: React.ComponentType<RoleItemProps>;
  SpecialMentionItem?: React.ComponentType<SpecialMentionItemProps>;
  UserGroupItem?: React.ComponentType<UserGroupItemProps>;
  UserItem?: React.ComponentType<UserItemProps>;
} & ComponentProps<'button'>;

export const MentionItem = ({
  BroadcastMentionItem = DefaultBroadcastMentionItem,
  entity,
  focused,
  RoleItem = DefaultRoleItem,
  SpecialMentionItem = DefaultSpecialMentionItem,
  UserGroupItem = DefaultUserGroupItem,
  UserItem = DefaultUserItem,
  ...buttonProps
}: MentionItemProps) => {
  if (entity.mentionType === 'user') {
    return <UserItem {...buttonProps} entity={entity} focused={focused} />;
  }

  if (entity.mentionType === 'role') {
    return <RoleItem {...buttonProps} entity={entity} focused={focused} />;
  }

  if (entity.mentionType === 'user_group') {
    return <UserGroupItem {...buttonProps} entity={entity} focused={focused} />;
  }

  if (entity.mentionType === 'channel' || entity.mentionType === 'here') {
    return <BroadcastMentionItem {...buttonProps} entity={entity} focused={focused} />;
  }

  return <SpecialMentionItem {...buttonProps} entity={entity} focused={focused} />;
};
