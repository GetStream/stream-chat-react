import React, { useEffect } from 'react';

import { MessageText } from '../../../components/Message/MessageText';
import type { StreamedMessageTextProps } from '../../../components/Message/StreamedMessageText';
import { StreamedMessageText } from '../../../components/Message/StreamedMessageText';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useMessageContext } from '../../../context/MessageContext';
import { useHeardText } from './hooks/useHeardText';

export type SpokenMessageTextProps = StreamedMessageTextProps;

/**
 * Renders an AI-generated message's text at the pace the user hears it spoken, for
 * apps that talk to a voice AI agent. A drop-in replacement for the
 * `StreamedMessageText` component slot:
 *
 * ```tsx
 * import { Channel, Chat, MessageList, WithComponents } from 'stream-chat-react';
 * import { SpokenMessageText, SpokenTextProvider } from 'stream-chat-react/ai-components';
 *
 * // The voice backend stamps each reply message with the turn it belongs to, and
 * // the voice session reports how much of each turn has been played back. A Stream
 * // Agents session (`@stream-io/calypso`) reads the turn off the message itself.
 * const heard = useCallback(
 *   (message: LocalMessage, now: number) => session.speech.heard(message, now),
 *   [session],
 * );
 * const subscribe = useCallback(
 *   (listener: () => void) => session.speech.subscribe(listener),
 *   [session],
 * );
 *
 * <Chat client={client} isMessageAIGenerated={(message) => !!message.ai_generated}>
 *   <Channel channel={channel}>
 *     <SpokenTextProvider heard={heard} subscribe={subscribe}>
 *       <WithComponents overrides={{ StreamedMessageText: SpokenMessageText }}>
 *         <MessageList />
 *       </WithComponents>
 *     </SpokenTextProvider>
 *   </Channel>
 * </Chat>
 * ```
 *
 * `SpokenMessageText` only renders for messages `isMessageAIGenerated` reports as AI
 * generated, like `StreamedMessageText`. The SDK has no dependency on any voice SDK:
 * `heard` is a plain function, and `subscribe` is optional (the component re-samples
 * `heard` on every animation frame while a message's speech is not done).
 *
 * The speech progress comes from the nearest `SpokenTextProvider` (see
 * `HeardTextFunction`). Without a provider, or when `heard` returns `undefined` for
 * the message, it renders the default `StreamedMessageText` unchanged. When paced, it
 * reveals the heard part of the text (never shrinking) and shows the full text once
 * the speech is done and the message is no longer `generating`, for messages loaded
 * from history, and after an `ai_indicator.stop` event (the user stopped the response).
 * The text is rendered through `MessageText`, so markdown and `renderText` keep working.
 */
export const SpokenMessageText = (props: SpokenMessageTextProps) => {
  const { message: messageFromProps, renderText } = props;
  const { message: messageFromContext } = useMessageContext('SpokenMessageText');
  const { channel } = useChannelStateContext('SpokenMessageText');
  const message = messageFromProps || messageFromContext;
  const { heardText, isPaced, skip } = useHeardText({ message });
  const messageId = message.id;

  useEffect(() => {
    if (!channel || !isPaced) return;
    const { unsubscribe } = channel.on('ai_indicator.stop', (event) => {
      if (!event.message_id || event.message_id === messageId) skip();
    });
    return unsubscribe;
  }, [channel, isPaced, messageId, skip]);

  if (!isPaced) return <StreamedMessageText {...props} />;

  return (
    <MessageText message={{ ...message, text: heardText }} renderText={renderText} />
  );
};
