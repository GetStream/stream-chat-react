import { useMemo } from 'react';
import type { ComponentType } from 'react';
import {
  MessageUI as DefaultMessageUI,
  type MessageUIComponentProps,
  useChannelStateContext,
  useMessageContext,
} from 'stream-chat-react';

import { createNicknameRenderText } from './renderTextWithNicknames';

/**
 * Wraps a message-UI component so its text renders channel nicknames in mentions.
 *
 * Why a wrapper and not just a `renderText` prop on `MessageList`: `renderText`'s signature is
 * `(text, mentionedUsers, options)` — it never sees the message, so it cannot read
 * `message.custom.mention_display_names`. Resolving that has to happen one level up, per message.
 *
 * A HOC rather than a fixed slot component because the demo already overrides the message UI
 * (`InlineEditableMessage`). Composing keeps both features instead of one clobbering the other,
 * and works because that component spreads `{...props}` into the default UI, so the injected
 * `renderText` reaches `MessageText`.
 */
export const withNicknameMentions = (
  MessageUIComponent: ComponentType<MessageUIComponentProps>,
) => {
  const MessageUIWithNicknameMentions = (props: MessageUIComponentProps) => {
    const { channel } = useChannelStateContext('withNicknameMentions');
    const { message: contextMessage } = useMessageContext('withNicknameMentions');
    const message = props.message ?? contextMessage;

    const renderText = useMemo(
      () => createNicknameRenderText({ channel, message }),
      [channel, message],
    );

    return <MessageUIComponent {...props} renderText={renderText} />;
  };

  MessageUIWithNicknameMentions.displayName = `withNicknameMentions(${
    MessageUIComponent.displayName || MessageUIComponent.name || 'MessageUI'
  })`;

  return MessageUIWithNicknameMentions;
};

/** Convenience for apps that do not otherwise override the message UI. */
export const NicknameMessageUI = withNicknameMentions(DefaultMessageUI);
