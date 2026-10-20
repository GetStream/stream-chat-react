'use client';

import { useEffect, useRef } from 'react';
import { VoiceGlow, VoiceWave } from 'stream-chat-react/ai-components';
import { useVoiceConversation, type VoicePhase } from './useVoiceConversation';
import { useVoiceMode } from './VoiceModeContext';
import './VoiceMode.scss';

/** The demo's palette for the voice agent; leave `colors` out to follow the theme's accent. */
const VOICE_COLORS = ['#005fff', '#7c3aed', '#06b6d4'];

const STATUS: Record<VoicePhase, string> = {
  error: 'Voice mode stopped',
  listening: 'Listening',
  paused: 'Paused',
  speaking: 'Speaking',
  starting: 'Connecting',
  waiting: 'Thinking',
};

const VoiceConversation = () => {
  const { close } = useVoiceMode();
  const { agentState, error, micLevel, pause, phase, reply, resume, transcript } =
    useVoiceConversation();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [close]);

  const paused = phase === 'paused';
  const caption =
    phase === 'error'
      ? error
      : phase === 'speaking'
        ? reply
        : phase === 'listening'
          ? transcript || 'Go ahead, I’m listening.'
          : phase === 'waiting'
            ? transcript
            : '';

  return (
    <div
      aria-label='Voice mode'
      aria-modal='true'
      className='ai-demo-voice-mode'
      role='dialog'
    >
      <div className='ai-demo-voice-mode__stage'>
        <VoiceGlow
          className='ai-demo-voice-mode__glow'
          colors={VOICE_COLORS}
          state={agentState}
        />
        <p aria-live='polite' className='ai-demo-voice-mode__status'>
          {STATUS[phase]}
        </p>
        <p className='ai-demo-voice-mode__caption'>{caption}</p>
      </div>

      {/* The glow is the agent; the wave under it is the user's microphone. */}
      <VoiceWave
        audioLevel={phase === 'listening' ? micLevel : undefined}
        className='ai-demo-voice-mode__wave'
        colors={VOICE_COLORS}
        expressivity={1.4}
        state={phase === 'listening' ? 'listening' : 'idle'}
      />

      <div className='ai-demo-voice-mode__controls'>
        <button
          aria-label={paused ? 'Resume voice mode' : 'Pause voice mode'}
          aria-pressed={paused}
          className='ai-demo-voice-mode__button'
          disabled={phase === 'error' || phase === 'starting'}
          onClick={paused ? resume : pause}
          type='button'
        >
          <span className='material-symbols-rounded'>{paused ? 'mic_off' : 'mic'}</span>
        </button>
        <button
          aria-label='End voice mode'
          className='ai-demo-voice-mode__button ai-demo-voice-mode__button--end'
          onClick={close}
          ref={closeRef}
          type='button'
        >
          <span className='material-symbols-rounded'>close</span>
        </button>
      </div>
    </div>
  );
};

/**
 * A hands-free conversation with the agent over the chat: it listens, sends what was said,
 * shows the agent thinking and reads its answer aloud. Mounted only while open, so the
 * microphone is released as soon as it closes.
 */
export const VoiceMode = () => {
  const { isOpen } = useVoiceMode();
  return isOpen ? <VoiceConversation /> : null;
};
