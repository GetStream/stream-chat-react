import clsx from 'clsx';
import type { ComponentProps } from 'react';
import React from 'react';
import { useMemo } from 'react';
import type { UserGroupMentionSuggestion } from 'stream-chat';
import { IconUsers } from '../../Icons';
import { ListItemLayout } from '../../ListItemLayout/ListItemLayout';
import { useTranslationContext } from '../../../context';
import { TokenizedSuggestionParts } from './TokenizedSuggestionParts';

export type UserGroupItemProps = {
  entity: UserGroupMentionSuggestion;
  focused?: boolean;
} & ComponentProps<'button'>;

const memberCountLabelKey = '{{ memberCount }} members';

export const UserGroupItem = ({
  entity,
  focused,
  ...buttonProps
}: UserGroupItemProps) => {
  void focused;
  const { t } = useTranslationContext();
  const title = entity.name || entity.id;

  const LeadingSlot = useMemo(
    () =>
      function UserGroupItemLeadingSlot() {
        return (
          <div className='str-chat__suggestion-list__mention-item-leading-slot'>
            <IconUsers className='str-chat__suggestion-list__mention-item-leading-slot-icon' />
          </div>
        );
      },
    [],
  );

  const memberCountLabel =
    typeof entity.memberCount === 'number'
      ? t(memberCountLabelKey, { memberCount: entity.memberCount }) ===
        memberCountLabelKey
        ? `${entity.memberCount} members`
        : t(memberCountLabelKey, { memberCount: entity.memberCount })
      : undefined;

  const rootProps = useMemo<ComponentProps<'button'>>(
    () => ({
      ...buttonProps,
      className: clsx(
        'str-chat__context-menu__button',
        buttonProps.className,
        'str-chat__suggestion-list__item-with-avatar',
      ),
      role: buttonProps.role ?? 'menuitem',
      title: `@${title}`,
    }),
    [buttonProps, title],
  );

  const displayTitle = useMemo(
    () => (
      <>
        <span>@</span>
        <TokenizedSuggestionParts tokenizedDisplayName={entity.tokenizedDisplayName} />
      </>
    ),
    [entity.tokenizedDisplayName],
  );

  return (
    <ListItemLayout
      contentClassName='str-chat__suggestion-list__item-content'
      description={memberCountLabel}
      descriptionClassName='str-chat__suggestion-list__item-details'
      LeadingSlot={LeadingSlot}
      RootElement='button'
      rootProps={rootProps}
      selected={focused}
      subtitle={entity.description}
      subtitleClassName='str-chat__suggestion-list__item-details'
      title={displayTitle}
      titleClassName='str-chat__suggestion-list__item-title str-chat__suggestion-list__mention-item-title'
    />
  );
};
