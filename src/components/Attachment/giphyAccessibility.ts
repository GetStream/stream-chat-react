/** Whether a string looks like a media URL, which must not be used as an accessible name. */
export const looksLikeUrl = (value?: string | null): boolean =>
  !!value && /^(https?:|\/\/)/i.test(value);

/**
 * Returns a human, non-URL giphy title for accessible names and announcements, or `undefined`.
 * Giphy payloads rarely carry a real title (it is often a media URL), so callers provide a generic
 * label for `undefined`. Shared by `Giphy` and `AttachmentActions` so both resolve it the same way.
 * @param title - Title from the attachment payload.
 */
export const getGiphyDescriptiveTitle = (title?: string | null): string | undefined =>
  looksLikeUrl(title) ? undefined : (title ?? undefined);
