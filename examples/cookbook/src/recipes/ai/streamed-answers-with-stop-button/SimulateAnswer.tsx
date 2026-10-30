import { useEffect } from 'react';
import { AIStates, msToNs, nsToMs } from 'stream-chat';
import type { Channel, Event, LocalMessage, MessagePaginatorState } from 'stream-chat';
import { useChatContext } from 'stream-chat-react';
import { isDemoChannelId } from '../../../base/client';

const params = new URLSearchParams(window.location.search);
const phases = ['thinking', 'streaming', 'done'] as const;
type Phase = (typeof phases)[number];
const requestedPhase = params.get('phase') as Phase | null;
const runs = params.get('simulate') === 'answer';
const channelId = params.get('channel');

const ASSISTANT_ID = 'docs-v15-ck-assistant';
const QUESTION_ID = 'docs-v15-ck-garden-assistant-3';
// Exists only in the page: the demo app never stores it.
const ANSWER_ID = 'docs-v15-ck-garden-assistant-answer';
const ANSWER = [
  'Good picks for a first season with six hours of sun:',
  '',
  '- **Lettuce** grows fast, and you can pick the leaves as you need them.',
  '- **Bush beans** need no support and crop for weeks.',
  '- **Zucchini** gives plenty from one or two plants.',
  '- **Radishes** are ready in about a month.',
  '',
  'Water in the morning, and mulch the beds to keep the soil moist.',
].join('\n');
// The streaming phase stops here, about halfway through the answer.
const STREAMING_STOP = ANSWER.indexOf('- **Zucchini**');

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The question the simulation answers is loaded in the channel's message list. */
const hasQuestion = ({ items }: MessagePaginatorState) =>
  !!items?.some(({ id }) => id === QUESTION_ID);

/**
 * For the screenshots: `?simulate=answer&channel=<id>&phase=thinking|streaming|done` plays, in
 * the page only, the events a backend sends while the assistant answers the channel's last
 * question, and stops at the phase: the assistant thinking, the answer half written, or the answer
 * finished. Without `phase`, it plays to the end. When it stops, it sets
 * `data-simulated-answer` on the root element, for the screenshot to wait for.
 */
export const SimulateAnswer = () => {
  const { client } = useChatContext();

  useEffect(() => {
    if (!runs || !isDemoChannelId(channelId)) return;
    const channel: Channel = client.channel('messaging', channelId);
    const lastPhase = phases.indexOf(requestedPhase ?? 'done');
    let cancelled = false;

    const dispatch = (event: Record<string, unknown>) => {
      if (cancelled) return;
      client.dispatchEvent({
        channel_id: channel.id,
        channel_type: channel.type,
        cid: channel.cid,
        created_at: msToNs(Date.now()),
        custom: {},
        ...event,
      } as unknown as Event);
    };

    const answerWith = (question: LocalMessage, text: string) => ({
      ...question,
      created_at: msToNs(nsToMs(question.created_at) + 60_000),
      custom: { ai_generated: true },
      html: '',
      id: ANSWER_ID,
      text,
      updated_at: msToNs(Date.now()),
      // The assistant as the channel's earlier answer has it, so the answer shows its avatar.
      user: channel.messagePaginator.state
        .getLatestValue()
        .items?.find(({ user }) => user?.id === ASSISTANT_ID)?.user,
      user_id: ASSISTANT_ID,
    });

    const play = async (question: LocalMessage) => {
      // The backend posts the empty answer first, then says it's thinking about it.
      dispatch({ message: answerWith(question, ''), type: 'message.new' });
      dispatch({
        ai_state: AIStates.Thinking,
        message_id: ANSWER_ID,
        type: 'ai_indicator.update',
      });
      if (lastPhase === 0) return;

      await wait(800);
      dispatch({
        ai_state: AIStates.Generating,
        message_id: ANSWER_ID,
        type: 'ai_indicator.update',
      });
      const end = lastPhase === 1 ? STREAMING_STOP : ANSWER.length;
      for (let length = 40; length < end; length += 40) {
        await wait(250);
        const text = ANSWER.slice(0, length);
        dispatch({ message: answerWith(question, text), type: 'message.updated' });
      }
      await wait(250);
      const text = ANSWER.slice(0, end);
      dispatch({ message: answerWith(question, text), type: 'message.updated' });
      if (lastPhase === 1) return;

      dispatch({ type: 'ai_indicator.clear' });
    };

    const finish = () => {
      if (!cancelled) document.documentElement.dataset.simulatedAnswer = 'true';
    };

    // Plays once, as soon as the question is loaded.
    let started = false;
    const unsubscribe = channel.messagePaginator.state.subscribe((state) => {
      if (started || !hasQuestion(state)) return;
      started = true;
      const question = state.items?.find(({ id }) => id === QUESTION_ID);
      if (question) void play(question).then(finish);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [client]);

  return null;
};
