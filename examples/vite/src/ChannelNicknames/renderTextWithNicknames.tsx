import type { Channel, LocalMessage } from 'stream-chat';
import {
  renderText as defaultRenderText,
  getRenderTextMentionEntities,
  type RenderTextFunction,
  type RenderTextMentionEntity,
} from 'stream-chat-react';

import { getMemberNickname, MENTION_DISPLAY_NAMES_KEY } from './nicknameData';

type CreateNicknameRenderTextParams = {
  channel: Channel;
  message: LocalMessage;
};

/**
 * Builds a `renderText` that highlights a mention written as either `@nickname` or `@username`.
 *
 * The default renderer derives one display text per entity — `entity.name || entity.id` — and
 * matches it literally against the message text. `mentioned_users` comes back from the server with
 * the *real* username, so `@nickname` in the text never matches by default.
 *
 * The fix is to emit **two entities for the same user**: one named with the nickname, one with the
 * username. `createMentionLookup` keys its replacement map by display text, so both tokens resolve
 * to the same user and both get wrapped in a `<mention>` node. That is what makes "mention them by
 * their nickname OR their username" work, with no change to the SDK.
 *
 * Nickname sources, in priority order:
 *   1. `message.custom.mention_display_names` — what the sender actually typed, written by
 *      `createNicknameMentionCompositionMiddleware`. Works at any channel size.
 *   2. `channel.state.members[id].nickname` — live lookup, and the only option for messages
 *      sent before this feature existed. Only available while the member is loaded.
 */
export const createNicknameRenderText =
  ({ channel, message }: CreateNicknameRenderTextParams): RenderTextFunction =>
  (text, mentionedUsers, options) => {
    const persistedDisplayNames = message[MENTION_DISPLAY_NAMES_KEY];
    const baseEntities =
      options?.messageMentionEntities ??
      getRenderTextMentionEntities({ mentioned_users: mentionedUsers });

    const entities = baseEntities.reduce<RenderTextMentionEntity[]>((acc, entity) => {
      if (entity.mentionType !== 'user') {
        acc.push(entity);
        return acc;
      }

      const nickname =
        persistedDisplayNames?.[entity.id] ?? getMemberNickname(channel, entity.id);

      // No nickname, or the mention was written with the username anyway — nothing to add.
      if (!nickname || nickname === entity.name) {
        acc.push(entity);
        return acc;
      }

      // Nickname first: `createMentionLookup` sorts by display-text length and first-wins on
      // collisions, so listing it up front keeps the longer/more specific token in play.
      acc.push({ ...entity, name: nickname }, entity);

      return acc;
    }, []);

    return defaultRenderText(text, mentionedUsers, {
      ...options,
      messageMentionEntities: entities,
    });
  };
