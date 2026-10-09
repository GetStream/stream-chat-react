import { useEffect, useRef, useState } from 'react';
import { useStableCallback } from '../../../../utils/useStableCallback';

// TypeScript declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
}

interface SpeechRecognitionErrorEvent extends Event {
  error:
    | 'no-speech'
    | 'aborted'
    | 'audio-capture'
    | 'network'
    | 'not-allowed'
    | 'service-not-allowed'
    | 'bad-grammar'
    | 'language-not-supported';
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

// Kept module-local on purpose: augmenting the global `Window` interface would
// leak into every consumer's type environment through the shipped .d.ts files.
type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const getSpeechRecognition = (): SpeechRecognitionConstructor | undefined => {
  if (typeof window === 'undefined') return undefined;
  const speechWindow = window as WindowWithSpeechRecognition;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
};

export type UseSpeechToTextOptions = {
  /**
   * Language for speech recognition (e.g., 'en-US', 'es-ES')
   * @default 'en-US'
   */
  lang?: string;
  /**
   * Whether to return interim (partial) results
   * @default true
   */
  interimResults?: boolean;
  /**
   * Maximum number of alternative transcriptions
   * @default 1
   */
  maxAlternatives?: number;
  /**
   * Whether recognition should continue after user stops speaking
   * @default false
   */
  continuous?: boolean;
  /**
   * Callback when transcription text changes
   */
  onTranscript?: (text: string) => void;
  /**
   * Callback when an error occurs
   */
  onError?: (error: string) => void;
};

export const useSpeechToText = (options: UseSpeechToTextOptions = {}) => {
  const {
    continuous = false,
    interimResults = true,
    lang = 'en-US',
    maxAlternatives = 1,
    onError,
    onTranscript,
  } = options;

  const [isListening, setIsListening] = useState(false);
  // stable wrappers so inline callbacks do not re-create the recognizer on every render
  const emitTranscript = useStableCallback((text: string) => onTranscript?.(text));
  const emitError = useStableCallback((error: string) => onError?.(error));
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if Web Speech API is supported
  const isSupported = !!getSpeechRecognition();

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = lang;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;
    recognition.continuous = continuous;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results);

      const text = results.reduce((accumulatedText, result) => {
        const transcript = result[0]?.transcript || '';

        if (result.isFinal) {
          accumulatedText = transcript;
        } else {
          accumulatedText += transcript;
        }

        return accumulatedText;
      }, '');

      emitTranscript(text);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'Speech recognition error';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please ensure a microphone is connected.';
          break;
        case 'not-allowed':
          errorMessage =
            'Microphone access denied. Please grant permission to use the microphone.';
          break;
        case 'network':
          errorMessage = 'Network error occurred during speech recognition.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      emitError(errorMessage);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onstart = () => {
      setIsListening(true);
    };

    return () => {
      recognition.stop();
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
    };
  }, [lang, interimResults, maxAlternatives, continuous, emitTranscript, emitError]);

  const startListening = useStableCallback(() => {
    if (!isSupported) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch {
        emitError('Failed to start speech recognition');
      }
    }
  });

  const stopListening = useStableCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  });

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  } as const;
};
