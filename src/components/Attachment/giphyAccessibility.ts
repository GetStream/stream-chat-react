/** True when a string looks like a media URL (so it must NOT be used as an accessible name). */
export const looksLikeUrl = (value?: string | null): boolean =>
  !!value && /^(https?:|\/\/)/i.test(value);

/**
 * Resolve a human, non-URL giphy title for accessible naming/announcements, or `undefined`.
 * Giphy payloads rarely carry a real title (they often fall back to a media URL), so callers
 * should provide a generic label when this returns `undefined`. Shared by `Giphy` (the image's
 * accessible name) and `AttachmentActions` (the shuffle announcement) so the
 * two stay in sync.
 */
export const getGiphyDescriptiveTitle = (title?: string | null): string | undefined =>
  looksLikeUrl(title) ? undefined : (title ?? undefined);
