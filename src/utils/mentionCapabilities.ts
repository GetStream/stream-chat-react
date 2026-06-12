import type { MentionSuggestion } from 'stream-chat';

import type { RenderTextMentionEntity } from '../components/Message/renderText/rehypePlugins';

export const MENTION_TYPE_CAPABILITY = {
  channel: 'notify-channel',
  here: 'notify-here',
  role: 'notify-role',
  user_group: 'notify-group',
} as const satisfies Record<Exclude<MentionSuggestion['mentionType'], 'user'>, string>;

type BroadcastMentionType = keyof typeof MENTION_TYPE_CAPABILITY;

export const isMentionTypeAllowedByChannelCapabilities = (
  mentionType: MentionSuggestion['mentionType'],
  channelCapabilities: Record<string, boolean> = {},
): boolean => {
  if (mentionType === 'user') return true;

  const capability = MENTION_TYPE_CAPABILITY[mentionType as BroadcastMentionType];
  return capability ? !!channelCapabilities[capability] : false;
};

export const filterRenderTextMentionEntitiesByChannelCapabilities = (
  entities: RenderTextMentionEntity[],
  channelCapabilities: Record<string, boolean>,
): RenderTextMentionEntity[] =>
  entities.filter((entity) =>
    isMentionTypeAllowedByChannelCapabilities(entity.mentionType, channelCapabilities),
  );
