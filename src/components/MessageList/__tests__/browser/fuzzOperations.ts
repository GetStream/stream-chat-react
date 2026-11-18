import {
  OWN_USER,
  readRenderedItems,
  receiveMessage,
  scrollBy,
  scrollToBottom,
  scrollToTop,
  setMessageHeight,
  wait,
  waitUntil,
} from './harness';
import type { Mounted } from './harness';
import type { Rng } from './prng';
import { SCROLL_TARGET_RETRY_WINDOW_MS } from './scenario';

/** The operations the fuzzer draws from, weighted. Shared with replays of a single seed. */
export type Operation = {
  name: string;
  run: (mounted: Mounted, rng: Rng, state: FuzzState) => Promise<string> | string;
  weight: number;
};

export type FuzzState = { suppressAutoscroll: boolean; viewportHeight: number };

const renderedMessageIds = (mounted: Mounted) =>
  readRenderedItems(mounted.frame)
    .map((item) => item.id)
    .filter((id) => id.startsWith('m-') || id.startsWith('live-'));

const dispatch = (mounted: Mounted, type: string, message: unknown) =>
  mounted.client.dispatchEvent({
    channel_id: mounted.channel.id,
    channel_type: mounted.channel.type,
    cid: mounted.channel.cid,
    message: message as never,
    type,
  } as never);

const findLoaded = (mounted: Mounted, id: string) =>
  mounted.channel.messagePaginator.items?.find((item) => item.id === id);

export const OPERATIONS: Operation[] = [
  {
    name: 'append from other',
    run: async (mounted, rng) => {
      const count = rng.int(1, 3);
      for (let i = 0; i < count; i += 1) {
        await receiveMessage(mounted, mounted.other, rng.pick([40, 64, 120, 300]));
      }
      return `${count}`;
    },
    weight: 4,
  },
  {
    name: 'append own',
    run: async (mounted, rng) => {
      await receiveMessage(mounted, OWN_USER, rng.pick([40, 64, 120]));
      return '';
    },
    weight: 2,
  },
  {
    name: 'scroll to top (load older)',
    run: async (mounted) => {
      await scrollToTop(mounted.frame);
      await wait(400);
      return '';
    },
    weight: 2,
  },
  {
    name: 'scroll by',
    run: async (mounted, rng) => {
      const delta = rng.int(-1200, 1200);
      await scrollBy(mounted.frame, delta);
      return `${delta}`;
    },
    weight: 5,
  },
  {
    name: 'scroll to bottom',
    run: async (mounted) => {
      // Stays at the bottom with `suppressAutoscroll` too: no new messages arrive in this step.
      await scrollToBottom(mounted.frame);
      return '';
    },
    weight: 2,
  },
  {
    name: 'grow or shrink a rendered message',
    run: (mounted, rng) => {
      const ids = renderedMessageIds(mounted);
      if (!ids.length) return 'none rendered';
      const id = rng.pick(ids);
      const height = rng.pick([20, 48, 160, 420]);
      setMessageHeight(id, height);
      return `${id}→${height}`;
    },
    weight: 3,
  },
  {
    name: 'edit a rendered message',
    run: (mounted, rng) => {
      const ids = renderedMessageIds(mounted);
      const message = ids.length ? findLoaded(mounted, rng.pick(ids)) : undefined;
      if (!message) return 'none rendered';
      dispatch(mounted, 'message.updated', {
        ...message,
        text: `${message.text} (edited)`,
      });
      return message.id;
    },
    weight: 1,
  },
  {
    name: 'delete a rendered message',
    run: (mounted, rng) => {
      const ids = renderedMessageIds(mounted);
      const message = ids.length ? findLoaded(mounted, rng.pick(ids)) : undefined;
      if (!message) return 'none rendered';
      dispatch(mounted, 'message.deleted', {
        ...message,
        deleted_at: message.updated_at,
        type: 'deleted',
      });
      return message.id;
    },
    weight: 1,
  },
  {
    name: 'jump to a message',
    run: async (mounted, rng) => {
      const target = rng.pick(mounted.history.slice(0, mounted.history.length - 10));
      await mounted.channel.messagePaginator.jumpToMessage(target.id);
      // VML clears the jump's focus signal (and its highlight) once the target was viewed; waiting
      // for that keeps later steps' renders the same across runtimes and fails a list that never
      // clears it. Then past the window in which the scroll target is re-applied.
      await waitUntil(
        () =>
          !mounted.channel.messagePaginator.messageFocusSignal.getLatestValue().signal,
        6000,
        'focus signal to clear',
      );
      await wait(SCROLL_TARGET_RETRY_WINDOW_MS);
      return target.id;
    },
    weight: 1,
  },
  {
    name: 'jump to latest',
    run: async (mounted) => {
      const button = mounted.frame.ownerDocument.querySelector<HTMLElement>(
        '[data-testid="scroll-to-latest-message-button"]',
      );
      if (!button) return 'no button';
      button.click();
      await wait(SCROLL_TARGET_RETRY_WINDOW_MS);
      return '';
    },
    weight: 1,
  },
  {
    name: 'resize viewport',
    run: async (mounted, rng, state) => {
      state.viewportHeight = rng.pick([360, 480, 600, 820]);
      mounted.rerender({ height: state.viewportHeight });
      // A resize re-arms a pending scroll target's retry window (B-26 covers acting inside it).
      await wait(SCROLL_TARGET_RETRY_WINDOW_MS);
      return `${state.viewportHeight}`;
    },
    weight: 1,
  },
  {
    name: 'toggle suppressAutoscroll',
    run: (mounted, _rng, state) => {
      state.suppressAutoscroll = !state.suppressAutoscroll;
      mounted.rerender({ props: { suppressAutoscroll: state.suppressAutoscroll } });
      return `${state.suppressAutoscroll}`;
    },
    weight: 1,
  },
];

export const pickOperation = (rng: Rng) => {
  const total = OPERATIONS.reduce((sum, operation) => sum + operation.weight, 0);
  let roll = rng.next() * total;
  for (const operation of OPERATIONS) {
    roll -= operation.weight;
    if (roll < 0) return operation;
  }
  return OPERATIONS[OPERATIONS.length - 1];
};
