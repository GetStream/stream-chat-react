'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AIStates, type Channel, MessageComposer } from 'stream-chat';
import { useAIState, useChannel, useChatContext } from 'stream-chat-react';
import {
  useAudioLevel,
  useSpeechToText,
  type VoiceAgentState,
} from 'stream-chat-react/ai-components';
import { checkRateLimit } from '@/components/rateLimitUtils';
import { isWatchedByAI, useSendAIMessage } from '@/components/useSendAIMessage';

/**
 * Where the conversation is:
 * - `starting`: asking for the microphone;
 * - `listening`: dictating the user's turn;
 * - `waiting`: the turn was sent and the agent is working on its answer;
 * - `speaking`: reading the answer aloud;
 * - `paused`: the user muted voice mode;
 * - `error`: it can't go on (no microphone, rate limit, ...).
 */
export type VoicePhase =
  | 'starting'
  | 'listening'
  | 'waiting'
  | 'speaking'
  | 'paused'
  | 'error';

const WORKING_STATES: string[] = [
  AIStates.Thinking,
  AIStates.ExternalSources,
  AIStates.Generating,
];

/** Long answers are cut, as browsers stop reading aloud after a while. */
const MAX_SPOKEN_LENGTH = 1200;
/** How long the agent may take to start on an answer before the turn is given up. */
const ANSWER_TIMEOUT = 20_000;

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Markdown as plain prose for reading aloud: code is skipped, formatting dropped. */
export const toSpeech = (markdown: string) =>
  markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_SPOKEN_LENGTH);

/**
 * The agent's answer, when it is the channel's latest message. Read from `latestMessage`, which
 * follows the newest message whatever window of the list is showing, and keeps up with its edits.
 */
const lastAgentMessage = (channel: Channel, userId?: string) => {
  const latest = channel.messagePaginator.latestMessage;
  return latest && latest.user?.id !== userId ? latest : undefined;
};

/**
 * A hands-free conversation with the AI agent on the current channel: listen to the user,
 * send what they said, wait for the agent's answer, read it aloud, then listen again.
 */
export const useVoiceConversation = () => {
  const { client } = useChatContext();
  const channel = useChannel();
  const { aiState } = useAIState(channel);
  const sendAIMessage = useSendAIMessage();
  // Spoken turns go through a composer of their own, so they leave the typed draft and its
  // attachments alone. It is never registered, so it keeps no draft of its own.
  const voiceComposer = useMemo(
    () =>
      new MessageComposer({
        client,
        compositionContext: channel,
        config: { drafts: { enabled: false } },
      }),
    [channel, client],
  );

  const [phase, setPhase] = useState<VoicePhase>('starting');
  const [mic, setMic] = useState<MediaStream | null>(null);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [agentStarting, setAgentStarting] = useState(false);

  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  const transcriptRef = useRef('');
  const sawAgentWorkRef = useRef(false);
  // The agent's last answer when a turn was sent, to tell a new answer from it.
  const previousAnswerIdRef = useRef<string | undefined>(undefined);
  const wasListeningRef = useRef(false);

  const micLevel = useAudioLevel(mic);

  const fail = useCallback((message: string) => {
    setError(message);
    setPhase('error');
  }, []);

  const { isListening, isSupported, startListening, stopListening } = useSpeechToText({
    onError: (message) => {
      // Silence and aborts end a turn on their own; anything else stops voice mode.
      if (/no speech|aborted/i.test(message)) return;
      fail(message);
    },
    onTranscript: (text) => {
      transcriptRef.current = text;
      setTranscript(text);
    },
  });

  // The microphone, for the level of the user's voice; released when voice mode closes.
  useEffect(() => {
    let stream: MediaStream | undefined;
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      fail('This browser cannot use a microphone.');
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((granted) => {
        if (cancelled) {
          granted.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = granted;
        setMic(granted);
        setPhase((current) => (current === 'starting' ? 'listening' : current));
      })
      .catch(() => fail('Voice mode needs access to your microphone.'));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [fail]);

  // Start dictating whenever it is the user's turn and recognition is not running.
  useEffect(() => {
    if (phase !== 'listening' || isListening || !isSupported) return;
    // Recognition can refuse to restart in the same tick it ended.
    const timeout = setTimeout(() => {
      try {
        transcriptRef.current = '';
        setTranscript('');
        startListening();
      } catch {
        // Already started; the next end restarts it.
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [isListening, isSupported, phase, startListening]);

  const submit = useCallback(
    (text: string) => {
      if (checkRateLimit(channel.id!).isLimited) {
        fail('Limit reached, 10 messages per conversation.');
        return;
      }
      sawAgentWorkRef.current = false;
      previousAnswerIdRef.current = lastAgentMessage(channel, client.userID)?.id;
      setReply('');
      setAgentStarting(!isWatchedByAI(channel));
      setPhase('waiting');
      sendAIMessage({ composer: voiceComposer, text })
        .then((sent) => {
          if (!sent) fail('Your message could not be sent.');
        })
        .catch(() => fail('Your message could not be sent.'));
    },
    [channel, client.userID, fail, sendAIMessage, voiceComposer],
  );

  // A turn ends when recognition stops: send what was said, or listen again after silence.
  useEffect(() => {
    if (isListening) {
      wasListeningRef.current = true;
      return;
    }
    if (!wasListeningRef.current) return;
    wasListeningRef.current = false;
    if (phaseRef.current !== 'listening') return;
    const text = transcriptRef.current.trim();
    if (text) submit(text);
  }, [isListening, submit]);

  const speak = useCallback((markdown: string) => {
    const text = toSpeech(markdown);
    if (!text || !canSpeak()) {
      setPhase('listening');
      return;
    }
    setReply(text);
    setPhase('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    const done = () => {
      if (phaseRef.current === 'speaking') setPhase('listening');
    };
    utterance.onend = done;
    utterance.onerror = done;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  // The agent's indicator: working while it thinks and writes, idle again once the answer is in.
  useEffect(() => {
    if (phaseRef.current !== 'waiting') return;
    if (WORKING_STATES.includes(aiState)) {
      sawAgentWorkRef.current = true;
      setAgentStarting(false);
      return;
    }
    if (!sawAgentWorkRef.current) return;
    speak(lastAgentMessage(channel, client.userID)?.text ?? '');
  }, [aiState, channel, client.userID, speak]);

  // A turn the agent is never seen working on (no indicator events, or missed ones) still ends:
  // with its answer if one came in, otherwise with an error, rather than waiting forever.
  useEffect(() => {
    if (phase !== 'waiting') return;
    const timeout = setTimeout(() => {
      if (sawAgentWorkRef.current) return;
      const answer = lastAgentMessage(channel, client.userID);
      if (answer && answer.id !== previousAnswerIdRef.current) speak(answer.text ?? '');
      else fail('The agent did not answer.');
    }, ANSWER_TIMEOUT);
    return () => clearTimeout(timeout);
  }, [channel, client.userID, fail, phase, speak]);

  const pause = useCallback(() => {
    setPhase('paused');
    stopListening();
    if (canSpeak()) window.speechSynthesis.cancel();
  }, [stopListening]);

  const resume = useCallback(() => setPhase('listening'), []);

  // Nothing keeps talking or listening once voice mode closes.
  useEffect(
    () => () => {
      if (canSpeak()) window.speechSynthesis.cancel();
    },
    [],
  );
  useEffect(() => {
    if (phase === 'paused' || phase === 'error') stopListening();
  }, [phase, stopListening]);

  const agentState: VoiceAgentState = (() => {
    switch (phase) {
      case 'starting':
        return 'connecting';
      case 'listening':
        return 'listening';
      case 'waiting':
        if (agentStarting) return 'connecting';
        // Without read-aloud, the answer being written is the agent speaking.
        return aiState === AIStates.Generating && !canSpeak() ? 'speaking' : 'thinking';
      case 'speaking':
        return 'speaking';
      default:
        return 'idle';
    }
  })();

  return {
    agentState,
    error,
    isSupported,
    micLevel,
    pause,
    phase,
    reply,
    resume,
    transcript,
  };
};
