import { createContext, useContext } from 'react';

/** How long a first step that arrived done stays open, showing its reasoning, before it folds. */
export const FINISHED_REASONING_SHOWN_MS = 1600;
/** How long the reasoning takes to fold. */
export const REASONING_FOLD_MS = 450;
// How soon after a turn stops thinking its first step has to arrive, done, to open and show its
// reasoning: it came with the reply that ended the thinking.
const ARRIVAL_WINDOW_MS = 1000;

type Turn = {
  start: number;
  end?: number;
  firstStep?: string;
  firstStepDuration?: number;
  // When a first step that arrived done opened to show its reasoning.
  firstStepShown?: number;
  firstStepStreamed: boolean;
  // Whether a reply of the turn showed.
  hadReplies: boolean;
};

/**
 * Times each turn's thinking, so the reply's first reasoning step takes over the seconds the
 * conversation counted while it showed the agent thinking. The counterpart of `AIThinkingClock`.
 */
export class AIThinkingClock {
  private turns = new Map<string, Turn>();

  // A turn's thinking starts the first time it is the latest turn and thinking, and ends when it
  // stops. Thinking that resumes before the first step shows carries on. A turn whose replies were
  // taken away starts thinking afresh.
  update(
    latest: string | undefined,
    isThinking: boolean,
    hasReplies: boolean,
    now = Date.now(),
  ) {
    if (latest === undefined) return;
    const timed = this.turns.get(latest);
    if (!timed || (isThinking && timed.hadReplies && !hasReplies)) {
      if (isThinking) {
        this.turns.set(latest, {
          firstStepStreamed: false,
          hadReplies: false,
          start: now,
        });
      }
      return;
    }
    if (hasReplies) timed.hadReplies = true;
    if (isThinking) {
      if (timed.firstStep === undefined) timed.end = undefined;
    } else if (timed.end === undefined) {
      timed.end = now;
    }
  }

  start(turn: string) {
    return this.turns.get(turn)?.start;
  }

  // Whether `step` takes over a turn's thinking: the first reasoning step to show in a turn that
  // was seen thinking.
  isFirstStep(step: string, turn: string) {
    const timed = this.turns.get(turn);
    if (!timed) return false;
    timed.firstStep ??= step;
    return timed.firstStep === step;
  }

  firstStepIsStreaming(turn: string) {
    const timed = this.turns.get(turn);
    if (timed) timed.firstStepStreamed = true;
  }

  // How long a turn's first step thought, in seconds: from when the turn started thinking until
  // the step was done. The step's own time counts when it is longer.
  durationOfFirstStep(turn: string, own: number | undefined, now = Date.now()) {
    const timed = this.turns.get(turn);
    if (!timed) return own;
    if (timed.firstStepDuration !== undefined) return timed.firstStepDuration;
    const done = timed.firstStepStreamed ? now : (timed.end ?? now);
    const measured = Math.max(own ?? 0, (done - timed.start) / 1000);
    timed.firstStepDuration = measured;
    return measured;
  }

  // Whether a turn's first step, which arrived done with the reply that ended the thinking, opens
  // to show its reasoning before it folds and the answer starts.
  showsFirstStep(turn: string, now = Date.now()) {
    const timed = this.turns.get(turn);
    if (!timed || timed.firstStepStreamed) return false;
    if (timed.firstStepShown !== undefined) {
      return now - timed.firstStepShown < ARRIVAL_WINDOW_MS;
    }
    if (timed.end === undefined || now - timed.end >= ARRIVAL_WINDOW_MS) return false;
    timed.firstStepShown = now;
    return true;
  }
}

export type AIThinkingTurn = { clock: AIThinkingClock; key: string };

export const AIThinkingTurnContext = createContext<AIThinkingTurn | undefined>(undefined);

export const useAIThinkingTurn = () => useContext(AIThinkingTurnContext);
