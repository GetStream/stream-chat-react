import { useEffect, useRef } from 'react';
import { AIStates } from 'stream-chat';
import type { AIState } from 'stream-chat';
import { useAriaLiveAnnouncer } from 'stream-chat-react';

/** The assistant is working on an answer: thinking, checking sources or writing it. */
const isAnswering = (aiState: AIState) =>
  aiState === AIStates.Thinking ||
  aiState === AIStates.ExternalSources ||
  aiState === AIStates.Generating;

/** What to say when an answer ends in each state that isn't answering. */
const endings: Partial<Record<AIState, string>> = {
  [AIStates.Error]: 'The assistant couldn’t finish the answer',
  [AIStates.Idle]: 'The assistant finished answering',
  [AIStates.Stop]: 'Answer stopped',
};

/**
 * Tells a screen reader how the assistant's answer goes, without reading every streamed word:
 * that it started, and that it finished, stopped or failed. The finished answer is then one
 * message the user reads like any other. Each change is announced once: a repeated state, such as
 * StrictMode running the effect twice, says nothing, and an ending is announced only after an
 * answer, so mounting on an earlier error stays quiet.
 */
export const useAnswerAnnouncements = (aiState: AIState) => {
  const announce = useAriaLiveAnnouncer();
  // Starts idle, so opening the channel mid-answer announces it too.
  const previousState = useRef<AIState>(AIStates.Idle);

  useEffect(() => {
    if (previousState.current === aiState) return;
    const wasAnswering = isAnswering(previousState.current);
    previousState.current = aiState;

    if (isAnswering(aiState)) {
      if (!wasAnswering) announce('The assistant is answering');
    } else if (wasAnswering && endings[aiState]) {
      announce(endings[aiState]);
    }
  }, [aiState, announce]);
};
