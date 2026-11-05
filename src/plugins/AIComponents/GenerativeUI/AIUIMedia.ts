/**
 * Decides what a reply's UI loads for an image, video or sound the agent linked to: the URL to
 * load, which may be another, or `null` not to load it. The agent writes these links, so one
 * could track the person or reach their network. The counterpart of `mediaURL` in StreamChatAI.
 */
export type AIUIMediaURL = (url: URL) => URL | string | null | undefined;

const PRIVATE_HOST =
  /^(localhost|.*\.localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|\[(::1?|f[cd][0-9a-f]*:.*|fe[89ab][0-9a-f]*:.*|::ffff:.*)\])$/i;

/**
 * Whether `url` is a public web link: http or https, to a host that isn't this device or its
 * network, such as `localhost` or `192.168.1.1`.
 */
export const isPublicWebURL = (url: URL) =>
  (url.protocol === 'http:' || url.protocol === 'https:') &&
  !PRIVATE_HOST.test(url.hostname);

/**
 * The media a reply's UI loads by default: public web links, and links to the page's own
 * site. Others, such as `data:` URLs or addresses on the person's network, don't load.
 */
export const aiUIPublicMediaURL: AIUIMediaURL = (url) =>
  isPublicWebURL(url) ||
  (typeof window !== 'undefined' && url.origin === window.location.origin)
    ? url
    : null;

/**
 * The address to load for a link the agent wrote, as `mediaURL` decides it, or `undefined` not
 * to load anything. Renderers call it before they draw an image, video or sound.
 */
export const aiUIMediaSource = (
  value: unknown,
  mediaURL: AIUIMediaURL = aiUIPublicMediaURL,
): string | undefined => {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  let url: URL;
  try {
    url = new URL(
      value.trim(),
      typeof window === 'undefined' ? undefined : window.location.href,
    );
  } catch {
    return undefined;
  }
  const decided = mediaURL(url);
  if (decided === null || decided === undefined) return undefined;
  return typeof decided === 'string' ? decided : decided.href;
};
