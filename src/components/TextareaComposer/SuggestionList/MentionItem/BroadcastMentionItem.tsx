import clsx from 'clsx';
import React from 'react';
import type { ChannelMentionSuggestion, HereMentionSuggestion } from 'stream-chat';
import { IconMegaphone } from '../../../Icons';
import { ListItemLayout } from '../../../ListItemLayout';
import { useTranslationContext } from '../../../../context';
import { MentionSuggestionTitle } from './MentionSuggestionTitle';
import type { MentionItemComponentProps } from './types';

export type BroadcastMentionItemProps = MentionItemComponentProps<
  ChannelMentionSuggestion | HereMentionSuggestion
>;

export const BroadcastMentionItem = ({
  entity,
  focused,
  ...buttonProps
}: BroadcastMentionItemProps) => {
  const { t } = useTranslationContext();
  const description =
    entity.mentionType === 'channel'
      ? t('mention/Channel Description')
      : t('mention/Here Description');

  return (
    <ListItemLayout
      contentClassName='str-chat__suggestion-list__item-content'
      description={description}
      descriptionClassName='str-chat__suggestion-list__item-details'
      LeadingIcon={IconMegaphone}
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
      title={<MentionSuggestionTitle>{entity.name}</MentionSuggestionTitle>}
      titleClassName='str-chat__suggestion-list__item-title str-chat__suggestion-list__mention-item-title'
    />
  );
};
