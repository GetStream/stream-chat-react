import { mark, MARKS } from './marks';

// Live runs (`chatperf live`, WEB-PLAN.md §6.6): which live messages reached the client during the
// window, for the `live-delivered` gate, and the idle window itself.
//
// chatperf stamps every live message with a marker counted from 9000 ("[9001]", "[9002]", …), so
// history ([0001]…[2000]) and live traffic can't be confused. Delivery is counted from the events
// the client receives, not from the list: on livestream the cap (230) prunes old messages, so
// counting what's loaded would undercount a perfectly delivered run.

const LIVE_MARKER = /\[(\d{4,})\]\s*$/;
const FIRST_LIVE = 9001;

type MessageNewEvent = { type: string; cid?: string; message?: { text?: string } };

let delivery: { cid: string; markers: Set<number> } | null = null;

/** Called from the client-event tap for every event the client receives. */
export const noteLiveEvent = (event: MessageNewEvent) => {
  if (!delivery || event.type !== 'message.new' || event.cid !== delivery.cid) return;
  const m = event.message?.text?.match(LIVE_MARKER);
  const n = m ? Number(m[1]) : 0;
  if (n >= FIRST_LIVE) delivery.markers.add(n);
};

export const startDelivery = (cid: string) => {
  delivery = { cid, markers: new Set() };
};

/** Distinct live messages received since `startDelivery`. Cheap: the runner polls it after the run. */
export const deliveredCount = () => delivery?.markers.size ?? 0;

export type Delivery = { count: number; first: number | null; last: number | null };

export const stopDelivery = (): Delivery => {
  const markers = [...(delivery?.markers ?? [])].sort((a, b) => a - b);
  delivery = null;
  return {
    count: markers.length,
    first: markers[0] ?? null,
    last: markers.at(-1) ?? null,
  };
};

/**
 * The measured idle window: marks its start and end and resolves after `ms`. Nothing runs in the
 * page meanwhile; the runner makes this one call and waits.
 */
export const idle = (ms: number) =>
  new Promise<number>((resolve) => {
    const start = performance.now();
    mark(MARKS.windowStart, start);
    setTimeout(() => {
      const end = performance.now();
      mark(MARKS.windowEnd, end);
      resolve(end - start);
    }, ms);
  });
