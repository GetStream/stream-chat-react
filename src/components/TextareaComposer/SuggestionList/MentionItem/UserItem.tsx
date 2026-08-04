import clsx from 'clsx';
import React, { useMemo } from 'react';
import type { UserSuggestion } from 'stream-chat';
import { Avatar as DefaultAvatar } from '../../../Avatar';
import { extractDisplayInfo as defaultExtractDisplayInfo } from '../../../Avatar/utils';
import { ListItemLayout } from '../../../ListItemLayout';
import { useComponentContext } from '../../../../context';
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
  const { Avatar = DefaultAvatar, extractDisplayInfo = defaultExtractDisplayInfo } =
    useComponentContext();
  const hasEntity = !!Object.keys(entity).length;

  const titleAttribute = entity.name || entity.id || '';
  const LeadingSlot = useMemo(() => {
    const displayInfo = extractDisplayInfo({ user: entity });

    return function UserItemAvatar() {
      // Decorative: the option's accessible name already carries the user's name (title +
      // tokenized display name), so the avatar's fallback initials/role would only add noise.
      return <Avatar {...displayInfo} aria-hidden size='md' />;
    };
  }, [Avatar, entity, extractDisplayInfo]);

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
