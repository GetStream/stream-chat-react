import clsx from 'clsx';
import type { ComponentProps } from 'react';
import React from 'react';
import { useMemo } from 'react';
import type { ChannelMentionSuggestion, HereMentionSuggestion } from 'stream-chat';
import { IconMegaphone } from '../../Icons';
import { ListItemLayout } from '../../ListItemLayout/ListItemLayout';
import { useTranslationContext } from '../../../context';

type SpecialMentionItemEntity = {
  id: string;
  mentionType: string;
  name?: string;
};

export type SpecialMentionItemProps = {
  entity: ChannelMentionSuggestion | HereMentionSuggestion | SpecialMentionItemEntity;
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

const isSpecialMentionType = (
  mentionType: string,
): mentionType is keyof typeof descriptionByMentionType =>
  mentionType in descriptionByMentionType;

const isTranslationFallback = (translatedValue: string, translationKey: string) =>
  translatedValue === translationKey ||
  translatedValue === translationKey.split('/').pop();

export const SpecialMentionItem = ({
  entity,
  focused,
  ...buttonProps
}: SpecialMentionItemProps) => {
  void focused;
  const { t } = useTranslationContext();
  const label = `@${entity.name ?? entity.id}`;

  const descriptionConfig = isSpecialMentionType(entity.mentionType)
    ? descriptionByMentionType[entity.mentionType]
    : undefined;

  const translatedDescription = descriptionConfig
    ? t(descriptionConfig.translationKey)
    : '';

  const description = descriptionConfig
    ? isTranslationFallback(translatedDescription, descriptionConfig.translationKey)
      ? descriptionConfig.fallback
      : translatedDescription
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
      title: label,
    }),
    [buttonProps, label],
  );

  return (
    <ListItemLayout
      contentClassName='str-chat__suggestion-list__item-content'
      description={description}
      descriptionClassName='str-chat__suggestion-list__item-details'
      LeadingIcon={IconMegaphone}
      RootElement='button'
      rootProps={rootProps}
      selected={focused}
      title={label}
      titleClassName='str-chat__suggestion-list__item-title str-chat__suggestion-list__mention-item-title'
    />
  );
};
