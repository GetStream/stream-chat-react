import type { ComponentProps } from 'react';
import React from 'react';
import type { ChannelMentionSuggestion, HereMentionSuggestion } from 'stream-chat';
import { IconMegaphone } from '../../Icons';
import { useTranslationContext } from '../../../context';
import { SuggestionItemWithAvatar } from './SuggestionItemWithAvatar';

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
  const descriptionConfig = descriptionByMentionType[entity.mentionType];
  const translatedDescription = t(descriptionConfig.translationKey);
  const description = isTranslationFallback(
    translatedDescription,
    descriptionConfig.translationKey,
  )
    ? descriptionConfig.fallback
    : translatedDescription;

  return (
    <SuggestionItemWithAvatar
      {...buttonProps}
      avatarFallbackIcon={IconMegaphone}
      details={description}
      title={label}
    >
      {label}
    </SuggestionItemWithAvatar>
  );
};
