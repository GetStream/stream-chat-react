import type {
  CustomMessageData,
  MessageComposer,
  MessageComposerMiddlewareState,
  MessageCompositionMiddleware,
  MiddlewareHandlerParams,
} from 'stream-chat';

import { MENTION_DISPLAY_NAMES_KEY } from './nicknameData';

/**
 * Records, on the message itself, which display text each mention was written with.
 *
 * Why bother, when the renderer could just look the nickname up on the channel member?
 *
 * Because mention display text is **frozen into `message.text`** at send time — the composer
 * inserts `@${name}` and the renderer matches that literal substring. So the renderer does not
 * need the *current* nickname; it needs to know which token maps to which user. Reading that back
 * off the message means:
 *
 *   - no dependency on `channel.state.members` holding the mentioned user (breaks past 100 members)
 *   - the rendered mention stays consistent with the frozen text after a rename
 *
 * The trade-off is the flip side of that last point: renaming somebody does **not** retroactively
 * rewrite mentions in old messages. Live resolution would mean storing `@user_id` in the text and
 * resolving at render time — a different product, and a much larger change.
 *
 * Must run after the SDK's text-composition middleware, which is what populates `mentioned_users`.
 */
export const createNicknameMentionCompositionMiddleware = (
  composer: MessageComposer,
): MessageCompositionMiddleware => ({
  id: 'demo/message-composer-middleware/nickname-mention-display-names',
  handlers: {
    compose: ({
      state,
      next,
      forward,
    }: MiddlewareHandlerParams<MessageComposerMiddlewareState>) => {
      const mentionedUsers = state.localMessage.mentioned_users ?? [];

      if (!mentionedUsers.length) return forward();

      const mentionedUserIds = new Set(mentionedUsers.map((user) => user.id));
      const displayNames: Record<string, string> = {};

      // `textComposer.mentions` holds the entities the user actually picked from the dropdown,
      // with `name` already set to the nickname by NicknameMentionsSearchSource#toUserSuggestion.
      composer.textComposer.mentions.forEach((entity) => {
        if (entity.mentionType !== 'user' || !entity.name) return;
        if (!mentionedUserIds.has(entity.id)) return;

        displayNames[entity.id] = entity.name;
      });

      if (!Object.keys(displayNames).length) return forward();

      // Custom message fields go at the **top level** of the payload in this SDK version —
      // `LocalMessage` / `MessageRequest` are `CustomMessageData & { … }`, and the SDK's own
      // `custom-data` composition middleware spreads them the same way.
      const customData = {
        [MENTION_DISPLAY_NAMES_KEY]: displayNames,
      } as CustomMessageData;

      return next({
        ...state,
        localMessage: { ...state.localMessage, ...customData },
        message: { ...state.message, ...customData },
      });
    },
  },
});
