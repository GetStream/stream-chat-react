import { getWorkspaceFromUrl } from './WorkspaceUrlSync.tsx';

/**
 * Reads "open each channel at this message" out of the URL.
 *
 * Grammar (repeat the param once per channel):
 *   focus = <cid> ":" <messageId>
 *
 * Example:
 *   ?focus=messaging:general:msg_123&focus=messaging:random:msg_456
 *
 * The companion of `?workspace=`: that param says which channels are open, this one says where each
 * of them should open. One entry per channel, because the example can show two side by side and each
 * scrolls to its own message.
 *
 * Strictly a companion -- an entry naming a channel `?workspace=` is not opening is dropped, not
 * jumped to. Nothing would render the result, so honouring it would only spend a query loading a
 * window no one can see (and watching a channel no one asked to open). Slots from both views count:
 * the inactive view's channels render as soon as the user switches, with no reload.
 *
 * Read-only, unlike `?workspace=`: the URL is read once at startup and nothing writes back.
 */

const FOCUS_PARAM = 'focus';

export type FocusTarget = { cid: string; messageId: string };

/**
 * `cid` is `<type>:<id>`, so the message id is what follows the *last* colon. Neither channel ids
 * nor message ids may contain one, which is what makes splitting from the right unambiguous.
 */
const parseFocusToken = (token: string): FocusTarget | undefined => {
  const separatorIndex = token.lastIndexOf(':');
  if (separatorIndex < 1) return undefined;

  const cid = token.slice(0, separatorIndex);
  const messageId = token.slice(separatorIndex + 1);
  // A bare `type:id` is a cid with no message — nothing to jump to.
  if (!messageId || !cid.includes(':')) return undefined;

  return { cid, messageId };
};

/** The cids `?workspace=` opens, in any view, as a base binding or a layer. */
const getWorkspaceChannelCids = (): Set<string> =>
  new Set(
    (getWorkspaceFromUrl()?.slots ?? [])
      .flatMap(({ base, layers }) => [base, ...layers])
      .filter(({ kind }) => kind === 'channel')
      .map(({ key }) => key),
  );

export const getFocusTargetsFromUrl = (): FocusTarget[] => {
  const parsed = new URLSearchParams(window.location.search)
    .getAll(FOCUS_PARAM)
    .map(parseFocusToken)
    .filter((target): target is FocusTarget => !!target);

  if (!parsed.length) return parsed;

  const openCids = getWorkspaceChannelCids();
  return parsed.filter(({ cid }) => openCids.has(cid));
};
