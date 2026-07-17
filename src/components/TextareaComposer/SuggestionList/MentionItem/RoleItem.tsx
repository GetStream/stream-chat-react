import clsx from 'clsx';
import React from 'react';
import type { RoleMentionSuggestion } from 'stream-chat';
import { IconShield as DefaultIconShield } from '../../../Icons';
import { ListItemLayout } from '../../../ListItemLayout';
import { useComponentContext, useTranslationContext } from '../../../../context';
import { MentionSuggestionTitle } from './MentionSuggestionTitle';
import type { MentionItemComponentProps } from './types';
import { TokenizedSuggestionParts } from '../TokenizedSuggestionParts';

export type RoleItemProps = MentionItemComponentProps<RoleMentionSuggestion>;

export const RoleItem = ({ entity, focused, ...buttonProps }: RoleItemProps) => {
  const { icons: { IconShield = DefaultIconShield } = {} } = useComponentContext();

  void focused;
  const { t } = useTranslationContext();
  const role = entity.name;

  return (
    <ListItemLayout
      contentClassName='str-chat__suggestion-list__item-content'
      LeadingIcon={IconShield}
      RootElement='button'
      rootProps={{
        ...buttonProps,
        className: clsx(
          'str-chat__context-menu__button',
          buttonProps.className,
          'str-chat__suggestion-list__mention',
        ),
        role: buttonProps.role ?? 'menuitem',
        title: `@${role}`,
      }}
      selected={focused}
      subtitle={t('Notify all {{ role }} members', { role })}
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
