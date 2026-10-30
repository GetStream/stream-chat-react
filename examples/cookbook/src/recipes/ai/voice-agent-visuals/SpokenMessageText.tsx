import type { LocalMessage } from 'stream-chat';
import { MessageText, StreamedMessageText, useMessageContext } from 'stream-chat-react';
import type { StreamedMessageTextProps } from 'stream-chat-react';
import { useHeardText } from 'stream-chat-react/ai-components';
import { useVoiceSession } from './VoiceSession';
import type { VoiceSession } from './VoiceSession';

type Reply = NonNullable<VoiceSession['reply']>;

/** The assistant is speaking this message right now. */
const isSpokenNow = (
  reply: VoiceSession['reply'],
  message: LocalMessage,
): reply is Reply => reply?.messageId === message.id;

/** The reply's text, revealed as far as the user has heard it. */
const HeardText = ({
  message,
  renderText,
  reply,
}: StreamedMessageTextProps & { message: LocalMessage; reply: Reply }) => {
  const { heardText } = useHeardText({
    generating: reply.generating,
    heard: reply.heard,
    text: message.text ?? '',
  });
  return (
    <MessageText message={{ ...message, text: heardText }} renderText={renderText} />
  );
};

/**
 * Fills the `StreamedMessageText` slot, which `MessageUI` renders for the assistant's replies.
 * The model writes a reply far ahead of the voice that speaks it, so the reply being spoken shows
 * only what the user has heard. Every other reply streams in as usual.
 */
export const SpokenMessageText = (props: StreamedMessageTextProps) => {
  const { message: messageFromContext } = useMessageContext();
  const message = props.message ?? messageFromContext;
  const reply = useVoiceSession()?.reply;

  if (!isSpokenNow(reply, message)) return <StreamedMessageText {...props} />;
  return <HeardText {...props} message={message} reply={reply} />;
};
