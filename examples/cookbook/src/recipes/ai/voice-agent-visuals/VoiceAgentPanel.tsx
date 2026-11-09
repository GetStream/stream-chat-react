import { useId } from 'react';
import type { MouseEvent } from 'react';
import { Button } from 'stream-chat-react';
import { VoiceGlow, VoiceWave } from 'stream-chat-react/ai-components';
import type { VoiceAgentState } from 'stream-chat-react/ai-components';
import type { VoiceSession } from './VoiceSession';
import './VoiceAgentPanel.css';

/** What the status line shows in each state. */
const statusLabels: Record<VoiceAgentState, string> = {
  connecting: 'Connecting…',
  idle: 'Ready',
  listening: 'Listening',
  speaking: 'Speaking',
  thinking: 'Thinking…',
};

/** The user is talking, so the microphone's level moves the wave. */
const isUserTalking = (state: VoiceAgentState) => state === 'listening';

/** The assistant is talking, so its voice's level moves the glow. */
const isAgentTalking = (state: VoiceAgentState) => state === 'speaking';

/**
 * A call-like strip under the channel header while a voice conversation runs: the assistant as a
 * glow that moves with its state and voice, a status line, the user's microphone as a wave, and a
 * button that ends the conversation.
 */
export const VoiceAgentPanel = ({ session }: { session: VoiceSession }) => {
  const { agentLevel, end, micLevel, state } = session;
  const nameId = useId();

  // The panel and its button go away when the conversation ends, so focus moves to the composer.
  const handleEnd = (event: MouseEvent<HTMLButtonElement>) => {
    const composer = event.currentTarget
      .closest('.str-chat__channel')
      ?.querySelector('textarea');
    end();
    composer?.focus();
  };

  return (
    <section aria-labelledby={nameId} className='cookbook-voice-panel'>
      {/* Both visuals are hidden from screen readers: the status line says the state in words. */}
      <VoiceGlow
        aria-hidden='true'
        audioLevel={isAgentTalking(state) ? agentLevel : undefined}
        className='cookbook-voice-panel__glow'
        state={state}
      />
      <div className='cookbook-voice-panel__text'>
        <p className='cookbook-voice-panel__name' id={nameId}>
          Voice chat with Assistant
        </p>
        <p className='cookbook-voice-panel__status'>{statusLabels[state]}</p>
      </div>
      <VoiceWave
        aria-hidden='true'
        audioLevel={isUserTalking(state) ? micLevel : undefined}
        className='cookbook-voice-panel__wave'
        state={isUserTalking(state) ? 'listening' : 'idle'}
      />
      <Button
        appearance='outline'
        aria-label='End voice chat'
        onClick={handleEnd}
        size='sm'
        variant='danger'
      >
        End
      </Button>
    </section>
  );
};
