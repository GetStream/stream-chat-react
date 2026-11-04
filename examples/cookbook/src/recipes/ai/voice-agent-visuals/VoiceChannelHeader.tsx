import type { Channel } from 'stream-chat';
import { ChannelHeader, useChannel } from 'stream-chat-react';
import type { VoiceAgentState } from 'stream-chat-react/ai-components';
import { VoiceAgentPanel } from './VoiceAgentPanel';
import { useVoiceSession } from './VoiceSession';
import type { VoiceSession } from './VoiceSession';

/** The voice conversation is written into this channel. */
const isSessionChannel = (
  session: VoiceSession | undefined,
  channel: Channel,
): session is VoiceSession => session?.channelId === channel.id;

const inConversation = 'Voice chat started. Talk, and the assistant answers out loud.';

/**
 * What a screen reader announces in each state. Listening, thinking and speaking can be heard, so
 * they share one sentence: it's announced once, when the conversation starts, and not on every
 * turn. Only the states with no sound get their own words.
 */
const announcements: Record<VoiceAgentState, string> = {
  connecting: 'Connecting to the assistant…',
  idle: 'Voice chat ready',
  listening: inConversation,
  speaking: inConversation,
  thinking: inConversation,
};

/** The SDK's channel header, with the voice panel under it in the conversation's channel. */
export const VoiceChannelHeader = () => {
  const channel = useChannel();
  const session = useVoiceSession();
  const inSession = isSessionChannel(session, channel);

  return (
    <>
      <ChannelHeader />
      {inSession && <VoiceAgentPanel session={session} />}
      {/* Mounted, and empty, before the session starts, so its first words are announced. It
          follows the session, not the open channel: the voice is heard in every channel. */}
      <p className='cookbook-voice-announcement' role='status'>
        {session ? announcements[session.state] : ''}
      </p>
    </>
  );
};
