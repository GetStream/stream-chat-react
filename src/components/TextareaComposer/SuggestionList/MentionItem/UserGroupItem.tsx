import clsx from 'clsx';
import React from 'react';
import type { UserGroupMentionSuggestion } from 'stream-chat';
import { useComponentContext } from '../../../../context';
import { IconUsers as DefaultIconUsers } from '../../../Icons';
import { ListItemLayout } from '../../../ListItemLayout';
import { MentionSuggestionTitle } from './MentionSuggestionTitle';
import type { MentionItemComponentProps } from './types';
import { TokenizedSuggestionParts } from '../TokenizedSuggestionParts';

export type UserGroupItemProps = MentionItemComponentProps<UserGroupMentionSuggestion>;

export const UserGroupItem = ({
  entity,
  focused,
  ...buttonProps
}: UserGroupItemProps) => {
  const { icons: { IconUsers = DefaultIconUsers } = {} } = useComponentContext();

  void focused;

  return (
    <ListItemLayout
      contentClassName='str-chat__suggestion-list__item-content'
      LeadingIcon={IconUsers}
      RootElement='button'
      rootProps={{
        ...buttonProps,
        className: clsx(
          'str-chat__context-menu__button',
          buttonProps.className,
          'str-chat__suggestion-list__mention',
        ),
        role: buttonProps.role ?? 'menuitem',
        title: `@${entity.name}`,
      }}
      selected={focused}
      subtitle={entity.description}
      subtitleClassName='str-chat__suggestion-list__item-details'
      title={
        <MentionSuggestionTitle>
          <TokenizedSuggestionParts tokenizedDisplayName={entity.tokenizedDisplayName} />
        </MentionSuggestionTitle>
      }
      titleClassName='str-chat__suggestion-list__item-title str-chat__suggestion-list__mention-item-title'
    />
  );
};
