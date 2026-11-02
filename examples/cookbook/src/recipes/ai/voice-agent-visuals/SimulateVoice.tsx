import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { VoiceAgentState } from 'stream-chat-react/ai-components';
import demoData from './demo-data.json';
import type { VoiceSession } from './VoiceSession';
import { VoiceSessionProvider } from './VoiceSession';

const params = new URLSearchParams(window.location.search);
const STATES: VoiceAgentState[] = [
  'idle',
  'connecting',
  'listening',
  'thinking',
  'speaking',
];

/** `?state=` names one of the states the visuals take. */
const isVoiceAgentState = (value: string | null): value is VoiceAgentState =>
  STATES.includes(value as VoiceAgentState);

const requestedState = params.get('state');
const state: VoiceAgentState = isVoiceAgentState(requestedState)
  ? requestedState
  : 'speaking';
const freezeAfterFrames = Number(params.get('frames')) || undefined;

const channel = demoData.channels[0];
const reply = channel.messages[channel.messages.length - 1];
// The user has heard the reply's first sentence.
const heardChars = reply.text.indexOf('Drink');

// The time the levels are computed from: the fixed clock's while it runs, else the page's own.
let clockMs = 0;
const now = () => (freezeAfterFrames ? clockMs : performance.now());

/** A level that rises and falls like syllables, the same at the same time on every run. */
const speechLevel = () => {
  const t = now() / 1000;
  return 0.2 + 0.4 * Math.abs(Math.sin(t * 7.3)) * (0.6 + 0.4 * Math.sin(t * 1.9));
};

/** Both visuals have drawn their first frame. */
const visualsHaveStarted = () =>
  document.querySelectorAll('.cookbook-voice-panel [data-ready="true"]').length === 2;

/**
 * Replaces `requestAnimationFrame` with a clock that moves exactly 1/60 s a frame. Once the
 * visuals have started, it moves `frames` more times and then stops, so the visuals stay on the
 * same frame for the screenshot, and sets `data-simulated-voice` on the root element. Callbacks
 * keep running at the stopped time, so the rest of the page still renders.
 */
const runFixedClock = (frames: number) => {
  let callbacks = new Map<number, FrameRequestCallback>();
  let lastId = 0;
  let flushes = 0;
  let startedAt: number | undefined;

  window.requestAnimationFrame = (callback) => {
    callbacks.set(++lastId, callback);
    return lastId;
  };
  window.cancelAnimationFrame = (id) => {
    callbacks.delete(id);
  };

  const flush = () => {
    flushes++;
    if (startedAt === undefined && visualsHaveStarted()) startedAt = flushes;
    if (startedAt === undefined || flushes - startedAt < frames) clockMs += 1000 / 60;
    else document.documentElement.dataset.simulatedVoice = 'true';
    const due = callbacks;
    callbacks = new Map();
    due.forEach((callback) => callback(clockMs));
    setTimeout(flush, 16);
  };
  setTimeout(flush, 16);
};

if (freezeAfterFrames) runFixedClock(freezeAfterFrames);

/**
 * Not part of the recipe: stands in for a voice backend, which the demo app doesn't have. It
 * provides a voice session in the recipe's channel, in the state `?state=` names (speaking by
 * default), with levels that move like speech and the reply's first sentence heard.
 * `?frames=<n>` stops the visuals `n` frames after they start, for the screenshots.
 */
export const SimulateVoice = ({ children }: PropsWithChildren) => {
  const [ended, setEnded] = useState(false);

  const [session] = useState<VoiceSession>(() => ({
    agentLevel: speechLevel,
    channelId: channel.id,
    end: () => setEnded(true),
    micLevel: speechLevel,
    reply:
      state === 'speaking'
        ? {
            generating: false,
            heard: () => ({ chars: heardChars, done: false }),
            messageId: reply.id,
          }
        : undefined,
    state,
  }));

  return (
    <VoiceSessionProvider value={ended ? undefined : session}>
      {children}
    </VoiceSessionProvider>
  );
};
