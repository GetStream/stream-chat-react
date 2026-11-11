'use client';

import { useEffect, useState } from 'react';
import { useVoiceMode } from './VoiceModeContext';

const supportsVoiceMode = () =>
  typeof window !== 'undefined' &&
  !!(
    (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition ??
    (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  ) &&
  !!navigator.mediaDevices?.getUserMedia;

/** Opens voice mode; shown only where the browser can listen (Chrome, Edge, Safari). */
export const VoiceModeButton = () => {
  const { isOpen, open } = useVoiceMode();
  // Support is known only in the browser, so the button appears after hydration.
  const [isSupported, setIsSupported] = useState(false);
  useEffect(() => setIsSupported(supportsVoiceMode()), []);

  if (!isSupported) return null;

  return (
    <button
      aria-label='Start voice mode'
      aria-pressed={isOpen}
      className='str-chat__ai-message-composer__round-button ai-demo-voice-mode-button'
      onClick={open}
      title='Voice mode'
      type='button'
    >
      <span className='material-symbols-rounded'>graphic_eq</span>
    </button>
  );
};
