/**
 * The channel's message list as it is shown, read from the page: for the checks that judge what you
 * see (where the list rests, the numbers on its buttons) rather than the paginator's state. It is
 * found by the class names and test ids the SDK renders, so a markup change fails a check with
 * "not on screen" instead of crashing it.
 */

/** The scroll container of a message list. */
const LIST_SELECTOR = '.str-chat__message-list-scroll';
/** A thread's message list, left out: the scenarios run on the channel's. */
const THREAD_SELECTOR = '.str-chat__thread';
const MESSAGE_SELECTOR = 'li[data-message-id]';
const SCROLL_TO_LATEST_SELECTOR = '[data-testid="scroll-to-latest-message-button"]';
const SCROLL_TO_LATEST_COUNT_SELECTOR =
  '.str-chat__jump-to-latest-message [data-testid="unread-message-notification-counter"]';
/** The "New Messages!" pill, "113 new messages" once it counts them. */
const NEW_MESSAGES_PILL_SELECTOR = '[data-testid="message-notification"]';

/** How often, and how many times in a row, the list must look the same to count as settled. */
const SETTLE_POLL_MS = 100;
const SETTLE_POLLS = 5;
export const SETTLE_TIMEOUT_MS = 5000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The channel's message list on screen, if the app shows one. */
const findMessageList = () =>
  [...document.querySelectorAll<HTMLElement>(LIST_SELECTOR)].find(
    (list) => !list.closest(THREAD_SELECTOR),
  );

/** The list's buttons and notifications sit beside its scroll container. */
const overlayOf = (list: HTMLElement) => list.parentElement ?? list;

/** The first number in the text of `selector` beside `list`; `undefined` when it is not shown. */
const numberShown = (list: HTMLElement, selector: string) => {
  const match = overlayOf(list).querySelector(selector)?.textContent?.match(/\d+/);
  return match ? Number(match[0]) : undefined;
};

/** What the list shows: its buttons, and the numbers on them, as you see them. */
export const readMessageListOverlay = (list: HTMLElement) => ({
  newMessagesPill: overlayOf(list).querySelector(NEW_MESSAGES_PILL_SELECTOR)?.textContent,
  newMessagesPillCount: numberShown(list, NEW_MESSAGES_PILL_SELECTOR),
  scrollToLatestCount: numberShown(list, SCROLL_TO_LATEST_COUNT_SELECTOR),
  scrollToLatestShown: !!overlayOf(list).querySelector(SCROLL_TO_LATEST_SELECTOR),
});

/** How far the list is scrolled up from its bottom, in px. */
export const distanceFromBottom = (list: HTMLElement) =>
  list.scrollHeight - list.clientHeight - list.scrollTop;

/** Everything a settling list still changes: its scroll position, its height, its numbers. */
const lookOf = (list: HTMLElement) =>
  JSON.stringify([
    list.scrollTop,
    list.scrollHeight,
    list.clientHeight,
    list.querySelectorAll(MESSAGE_SELECTOR).length,
    readMessageListOverlay(list),
  ]);

/**
 * Waits until the message list stops changing: it looks the same for {@link SETTLE_POLLS} polls in
 * a row. `settled` is false when it was still changing at the timeout, or not on screen.
 */
export const settledMessageList = async (): Promise<{
  list?: HTMLElement;
  settled: boolean;
}> => {
  let previous: string | undefined;
  let samePolls = 0;
  // wall time: a tab in the background stretches its timers
  const deadline = Date.now() + SETTLE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const list = findMessageList();
    const look = list && lookOf(list);
    samePolls = look !== undefined && look === previous ? samePolls + 1 : 0;
    if (list && samePolls >= SETTLE_POLLS) return { list, settled: true };
    previous = look;
    await sleep(SETTLE_POLL_MS);
  }
  return { list: findMessageList(), settled: false };
};

/** Scrolls the list by `px` (negative: up), as a wheel does, and announces it with a scroll event. */
export const scrollListBy = (list: HTMLElement, px: number) => {
  list.scrollTop += px;
  list.dispatchEvent(new Event('scroll'));
};

/** How far the top of a message is below the top edge of the list, in px. */
export type MessageOffset = { id: string; offset: number };

const offsetIn = (list: HTMLElement, item: Element) =>
  item.getBoundingClientRect().top - list.getBoundingClientRect().top;

/** The topmost message you can see, at least in part. */
export const topmostVisibleMessage = (list: HTMLElement): MessageOffset | undefined => {
  const listTop = list.getBoundingClientRect().top;
  const item = [...list.querySelectorAll<HTMLElement>(MESSAGE_SELECTOR)].find(
    (message) => message.getBoundingClientRect().bottom > listTop,
  );
  const id = item?.dataset.messageId;
  return item && id ? { id, offset: offsetIn(list, item) } : undefined;
};

/** Where message `id` is now; `undefined` when the list does not show it. */
export const offsetOfMessage = (list: HTMLElement, id: string) => {
  const item = list.querySelector(
    `${MESSAGE_SELECTOR}[data-message-id="${CSS.escape(id)}"]`,
  );
  return item ? offsetIn(list, item) : undefined;
};
