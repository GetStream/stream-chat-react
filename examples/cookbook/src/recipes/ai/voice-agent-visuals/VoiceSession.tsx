import { createContext, useContext } from 'react';
import type { HeardTextFunction, VoiceAgentState } from 'stream-chat-react/ai-components';

/**
 * A live voice conversation with the assistant, as the app's voice backend reports it. The
 * conversation is also written into a channel: what the user says, and the assistant's replies.
 */
export type VoiceSession = {
  /** The channel the conversation is written into. */
  channelId: string;
  /** What the assistant is doing: idle, connecting, listening, thinking or speaking. */
  state: VoiceAgentState;
  /** The level of the user's microphone, from 0 to 1, for example from `useAudioLevel()`. */
  micLevel: () => number | null;
  /** The level of the assistant's voice, from 0 to 1, for example from `useAudioLevel()`. */
  agentLevel: () => number | null;
  /** The reply the assistant is speaking: its message, and how much of it the user has heard. */
  reply?: { messageId: string; heard: HeardTextFunction; generating: boolean };
  /** Ends the conversation. */
  end: () => void;
};

const VoiceSessionContext = createContext<VoiceSession | undefined>(undefined);

/** Makes the app's voice session available to the channel header and the message text. */
export const VoiceSessionProvider = VoiceSessionContext.Provider;

/** The voice session, or `undefined` while there is none. */
export const useVoiceSession = () => useContext(VoiceSessionContext);
