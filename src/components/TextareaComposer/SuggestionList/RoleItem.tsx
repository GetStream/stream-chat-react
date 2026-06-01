import clsx from 'clsx';
import type { ComponentProps } from 'react';
import React from 'react';
import { useMemo } from 'react';
import type { RoleMentionSuggestion } from 'stream-chat';
import { IconShield } from '../../Icons';
import { ListItemLayout } from '../../ListItemLayout/ListItemLayout';
import { useTranslationContext } from '../../../context';
import { TokenizedSuggestionParts } from './TokenizedSuggestionParts';

export type RoleItemProps = {
  entity: RoleMentionSuggestion;
  focused?: boolean;
} & ComponentProps<'button'>;

export const RoleItem = ({ entity, focused, ...buttonProps }: RoleItemProps) => {
  void focused;
  const { t } = useTranslationContext();
  const title = entity.name || entity.id;

  const LeadingSlot = useMemo(
    () =>
      function RoleItemLeadingSlot() {
        return (
          <div className='str-chat__suggestion-list__mention-item-leading-slot'>
            <IconShield className='str-chat__suggestion-list__mention-item-leading-slot-icon' />
          </div>
        );
      },
    [],
  );

  const rootProps = useMemo<ComponentProps<'button'>>(
    () => ({
      ...buttonProps,
      className: clsx(
        'str-chat__context-menu__button',
        buttonProps.className,
        'str-chat__suggestion-list__item-with-avatar',
      ),
      role: buttonProps.role ?? 'menuitem',
      title,
    }),
    [buttonProps, title],
  );

  const displayTitle = useMemo(
    () => <TokenizedSuggestionParts tokenizedDisplayName={entity.tokenizedDisplayName} />,
    [entity.tokenizedDisplayName],
  );

  return (
    <ListItemLayout
      contentClassName='str-chat__suggestion-list__item-content'
      LeadingSlot={LeadingSlot}
      RootElement='button'
      rootProps={rootProps}
      selected={focused}
      subtitle={t('Notify all {{ role }} members', { role: title })}
      subtitleClassName='str-chat__suggestion-list__item-details'
      title={displayTitle}
      titleClassName='str-chat__suggestion-list__item-title str-chat__suggestion-list__mention-item-title'
    />
  );
};
