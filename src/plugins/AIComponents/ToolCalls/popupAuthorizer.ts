import type { AIToolCallPart } from '../MessageParts';
import type { AIToolAuthorizer } from './AIToolApprover';

// The sign-in runs the router's launch page in a popup. The page asks its opener for the
// handoff token, then leaves for the provider, clearing its opener on the way. So the page the
// router finally sends the popup back to (the session's return_url) reports how it ended over
// a BroadcastChannel instead. The web counterpart of `AIWebAuthentication` in StreamChatAI.

/** The BroadcastChannel the return page reports the sign-in's outcome on. */
export const AI_CONNECTOR_SIGN_IN_CHANNEL = 'stream-chat-ai-connector-sign-in';

const READY = 'va.connector.oauth.ready';
const HANDOFF = 'va.connector.oauth.handoff';
const RESULT = 'va.connector.oauth.result';

/** How the router says a consent ended, in the return page's `status` query parameter. */
export type ConnectorSignInStatus =
  | 'connected'
  | 'denied'
  | 'failed'
  | 'account_mismatch';

const OUTCOMES: readonly string[] = [
  'connected',
  'denied',
  'failed',
  'account_mismatch',
] satisfies ConnectorSignInStatus[];

const CONNECTION_ID = /^[\w-]{1,128}$/;

/** The sign-in's outcome, as the return page read it from its query. */
export type ConnectorSignInResult = {
  connectionId: string;
  status: ConnectorSignInStatus;
};

/**
 * Why a sign-in could not be opened: the browser blocked the popup (`blocked`), the launch
 * page never asked for the handoff, such as when it does not take it from this origin
 * (`unreachable`), or the call carries no sign-in to open (`unavailable`).
 */
export class AIConnectorSignInError extends Error {
  readonly reason: 'blocked' | 'unavailable' | 'unreachable';

  constructor(reason: AIConnectorSignInError['reason']) {
    super(`The sign-in couldn't be opened (${reason}).`);
    this.name = 'AIConnectorSignInError';
    this.reason = reason;
  }
}

export type PopupAuthorizerOptions = {
  /**
   * Tells your backend the person won't sign in now. Your backend ends the call. A rejection
   * lets the person answer again.
   */
  decline: (call: AIToolCallPart) => Promise<void>;
  /**
   * The page the sign-in comes back to, which runs `completeConnectorSignIn()`. Give it to your
   * sessions as their `return_url`: the launch page takes the handoff only from a page of its
   * origin, so it must be this app's origin.
   */
  returnUrl: string;
  /** The BroadcastChannel name, the same as the return page's. Defaults to `AI_CONNECTOR_SIGN_IN_CHANNEL`. */
  channelName?: string;
  /** How often to check whether the person closed the popup, in milliseconds. Defaults to 500. */
  closedPollIntervalMs?: number;
  /** The popup's window features. Defaults to a 520 × 720 popup. */
  popupFeatures?: string;
  /** The popup's window name. */
  popupName?: string;
  /** How long the launch page has to ask for the handoff, in milliseconds. Defaults to 15 s. */
  readyTimeoutMs?: number;
  /**
   * How long to wait for the outcome once handed off, in milliseconds, when the sign-in names
   * no expiry. Defaults to 10 minutes, the router's consent lifetime.
   */
  timeoutMs?: number;
};

export type PopupAuthorizer = AIToolAuthorizer & { returnUrl: string };

/**
 * An `AIToolAuthorizer` that opens a call's sign-in in a popup, from the click itself, and
 * hands the sign-in its token over `postMessage`:
 *
 * 1. the popup opens the call's `authorization.url` (the router's launch page);
 * 2. the page posts `{ type: 'va.connector.oauth.ready' }` to this window, from its origin;
 * 3. this window posts back `{ type: 'va.connector.oauth.handoff', handoff_token }`, to that
 *    origin only;
 * 4. the page goes to the provider, which sends the person back through the router to
 *    `returnUrl`, where `completeConnectorSignIn()` reports the outcome over a BroadcastChannel.
 *
 * `connect` resolves `true` when the account is connected and `false` when the popup was closed
 * or the sign-in ended otherwise. It rejects with an `AIConnectorSignInError` when the browser
 * blocked the popup or the launch page never asked for the handoff.
 */
export const createPopupAuthorizer = ({
  channelName = AI_CONNECTOR_SIGN_IN_CHANNEL,
  closedPollIntervalMs = 500,
  decline,
  popupFeatures = 'popup,width=520,height=720',
  popupName = 'stream-chat-ai-sign-in',
  readyTimeoutMs = 15_000,
  returnUrl,
  timeoutMs = 10 * 60_000,
}: PopupAuthorizerOptions): PopupAuthorizer => {
  const connect = (call: AIToolCallPart): Promise<boolean> => {
    const authorization = call.authorization;
    if (!authorization?.handoffToken) {
      return Promise.reject(new AIConnectorSignInError('unavailable'));
    }
    const handoffToken = authorization.handoffToken;
    const target = new URL(authorization.url);
    // Opened before anything is awaited, so the click still counts as the user's gesture.
    const popup = window.open(target.href, popupName, popupFeatures);
    if (!popup) return Promise.reject(new AIConnectorSignInError('blocked'));

    return new Promise<boolean>((resolve, reject) => {
      let handedOff = false;
      let done = false;
      const stops: Array<() => void> = [];
      const finish = (outcome: boolean | AIConnectorSignInError) => {
        if (done) return;
        done = true;
        stops.forEach((stop) => stop());
        if (outcome instanceof AIConnectorSignInError) reject(outcome);
        else resolve(outcome);
      };

      const onMessage = (event: MessageEvent) => {
        if (handedOff || event.source !== popup || event.origin !== target.origin) return;
        const data = event.data as { type?: unknown } | null;
        if (!data || data.type !== READY) return;
        handedOff = true;
        popup.postMessage({ handoff_token: handoffToken, type: HANDOFF }, target.origin);
      };
      window.addEventListener('message', onMessage);
      stops.push(() => window.removeEventListener('message', onMessage));

      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel(channelName);
        channel.onmessage = (event: MessageEvent) => {
          const data = event.data as { status?: unknown; type?: unknown } | null;
          if (!handedOff || !data || data.type !== RESULT) return;
          if (typeof data.status !== 'string' || !OUTCOMES.includes(data.status)) return;
          finish(data.status === 'connected');
        };
        stops.push(() => channel.close());
      }

      // A launch page that never asks has refused this origin as its opener.
      const readyTimer = setTimeout(() => {
        if (handedOff) return;
        popup.close();
        finish(new AIConnectorSignInError('unreachable'));
      }, readyTimeoutMs);
      stops.push(() => clearTimeout(readyTimer));

      const remaining =
        authorization.expiresAt !== undefined
          ? Math.max(0, authorization.expiresAt - Date.now())
          : timeoutMs;
      const expiryTimer = setTimeout(
        () => finish(false),
        Math.max(remaining, readyTimeoutMs),
      );
      stops.push(() => clearTimeout(expiryTimer));

      // A provider's page can sever the popup from this window, which then looks closed while
      // the person is still deciding. Your backend's change to the step is the record either way.
      const closedTimer = setInterval(() => {
        if (popup.closed) finish(false);
      }, closedPollIntervalMs);
      stops.push(() => clearInterval(closedTimer));
    });
  };

  return { connect, decline, returnUrl };
};

/** Reads the router's redirect to the return page: `?connection_id=…&status=…`. */
export const readConnectorSignInResult = (
  search: string,
): ConnectorSignInResult | null => {
  const params = new URLSearchParams(search);
  const connectionId = params.get('connection_id') ?? '';
  const status = params.get('status') ?? '';
  if (!CONNECTION_ID.test(connectionId) || !OUTCOMES.includes(status)) return null;
  return { connectionId, status: status as ConnectorSignInStatus };
};

export type CompleteConnectorSignInOptions = {
  /** The BroadcastChannel name, the same as the authorizer's. Defaults to `AI_CONNECTOR_SIGN_IN_CHANNEL`. */
  channelName?: string;
  /** Whether to close the popup once the outcome is reported. Defaults to `true`. */
  close?: boolean;
  /** The query to read. Defaults to `window.location.search`. */
  search?: string;
};

/**
 * Runs on the page a sign-in comes back to (the `returnUrl` of `createPopupAuthorizer`): reads
 * `connection_id` and `status` from its query, reports them to the page that opened the
 * sign-in over a BroadcastChannel, and closes the popup.
 *
 * ```ts
 * // connected.html
 * import { completeConnectorSignIn } from 'stream-chat-react/ai-components';
 * completeConnectorSignIn();
 * ```
 *
 * Returns what it read, or `null` when the query holds no outcome.
 */
export const completeConnectorSignIn = ({
  channelName = AI_CONNECTOR_SIGN_IN_CHANNEL,
  close = true,
  search = typeof window === 'undefined' ? '' : window.location.search,
}: CompleteConnectorSignInOptions = {}): ConnectorSignInResult | null => {
  const result = readConnectorSignInResult(search);
  if (!result) return null;
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(channelName);
    channel.postMessage({
      connection_id: result.connectionId,
      status: result.status,
      type: RESULT,
    });
    channel.close();
  }
  if (close && typeof window !== 'undefined') window.close();
  return result;
};
