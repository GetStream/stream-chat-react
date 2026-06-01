import clsx from 'clsx';
import type { ComponentProps } from 'react';
import React from 'react';
import { useMemo } from 'react';
import type { ChannelMentionSuggestion, HereMentionSuggestion } from 'stream-chat';
import { IconMegaphone } from '../../Icons';
import { ListItemLayout } from '../../ListItemLayout/ListItemLayout';
import { useTranslationContext } from '../../../context';

export type BroadcastMentionItemProps = {
  entity: ChannelMentionSuggestion | HereMentionSuggestion;
  focused?: boolean;
} & ComponentProps<'button'>;

const descriptionByMentionType = {
  channel: {
    fallback: 'Notify everyone in this channel',
    translationKey: 'mention/Channel Description',
  },
  here: {
    fallback: 'Notify every online member in this channel',
    translationKey: 'mention/Here Description',
  },
} as const;

const isTranslationFallback = (translatedValue: string, translationKey: string) =>
  translatedValue === translationKey ||
  translatedValue === translationKey.split('/').pop();

export const BroadcastMentionItem = ({
  entity,
  focused,
  ...buttonProps
}: BroadcastMentionItemProps) => {
  void focused;
  const { t } = useTranslationContext();
  const label = `@${entity.name}`;

  const LeadingSlot = useMemo(
    () =>
      function BroadcastMentionLeadingSlot() {
        return (
          <div className='str-chat__suggestion-list__mention-item-leading-slot'>
            <IconMegaphone className='str-chat__suggestion-list__mention-item-leading-slot-icon' />
          </div>
        );
      },
    [],
  );

  const descriptionConfig = descriptionByMentionType[entity.mentionType];
  const translatedDescription = t(descriptionConfig.translationKey);
  const description = isTranslationFallback(
    translatedDescription,
    descriptionConfig.translationKey,
  )
    ? descriptionConfig.fallback
    : translatedDescription;

  const rootProps = useMemo<ComponentProps<'button'>>(
    () => ({
      ...buttonProps,
      className: clsx(
        'str-chat__context-menu__button',
        buttonProps.className,
        'str-chat__suggestion-list__item-with-avatar',
      ),
      role: buttonProps.role ?? 'menuitem',
      title: label,
    }),
    [buttonProps, label],
  );
  return (
    <ListItemLayout
      contentClassName='str-chat__suggestion-list__item-content'
      description={description}
      descriptionClassName='str-chat__suggestion-list__item-details'
      LeadingSlot={LeadingSlot}
      RootElement='button'
      rootProps={rootProps}
      selected={focused}
      title={label}
      titleClassName='str-chat__suggestion-list__item-title str-chat__suggestion-list__mention-item-title'
    />
  );
};
