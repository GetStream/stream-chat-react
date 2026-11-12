/**
 * Shared by `MessageList` and `VirtualizedMessageList` to find a focused message (a deep-link or
 * quoted-reply jump, or jump-to-latest) and to decide when the reader has viewed it, so the two
 * lists start the highlight's dismissal countdown under the same rule.
 */

/** `IntersectionObserver` thresholds that report the crossings `isMessageViewed` checks. */
export const MESSAGE_VIEWED_THRESHOLDS = [0, 0.5, 1];

/**
 * A message counts as viewed when half of it is visible, or when its visible slice fills half the
 * viewport (a message taller than the viewport never reaches a ratio of 0.5).
 */
export const isMessageViewed = (entry: IntersectionObserverEntry, rootHeight: number) =>
  entry.isIntersecting &&
  (entry.intersectionRatio >= 0.5 ||
    entry.intersectionRect.height >= (rootHeight || 1) * 0.5);

/**
 * Finds the rendered item of a message by its `data-message-id`. The ID is compared as a string
 * rather than interpolated into a selector: a custom message ID may contain quotes or backslashes.
 */
export const findMessageElement = (
  container: ParentNode,
  messageId: string,
): HTMLElement | null => {
  for (const element of container.querySelectorAll<HTMLElement>('[data-message-id]')) {
    if (element.getAttribute('data-message-id') === messageId) return element;
  }
  return null;
};
