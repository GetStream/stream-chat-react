import {
  AI_CONNECTOR_SIGN_IN_CHANNEL,
  AIClientIdentity,
  AIConnectorSignInError,
  completeConnectorSignIn,
  createPopupAuthorizer,
  readConnectorSignInResult,
} from '..';
import type { AIToolCallPart } from '..';

const LAUNCH = 'https://router.example.com/v1/agents/connectors/oauth/launch/abc';
const ORIGIN = 'https://router.example.com';

// A BroadcastChannel that delivers within the page, synchronously, to the other channels of
// the same name.
class FakeBroadcastChannel {
  static channels: FakeBroadcastChannel[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  closed = false;
  constructor(public name: string) {
    FakeBroadcastChannel.channels.push(this);
  }
  postMessage(data: unknown) {
    FakeBroadcastChannel.channels
      .filter(
        (channel) => channel !== this && !channel.closed && channel.name === this.name,
      )
      .forEach((channel) => channel.onmessage?.({ data }));
  }
  close() {
    this.closed = true;
  }
}

const createPopup = () => ({
  close: vi.fn(function (this: { closed: boolean }) {
    this.closed = true;
  }),
  closed: false,
  postMessage: vi.fn(),
});

type Popup = ReturnType<typeof createPopup>;

const call = (
  authorization?: Partial<AIToolCallPart['authorization']>,
): AIToolCallPart => ({
  authorization: {
    handoffToken: 'tok',
    provider: 'linear',
    title: 'Connect Linear',
    type: 'oauth',
    url: LAUNCH,
    ...authorization,
  },
  executor: 'server',
  id: 'call_2',
  name: 'linear_create_issue',
  status: 'awaiting_authorization',
  targetUserId: 'alex',
});

// jsdom only takes a real window as a MessageEvent's source, so the popup is set on it after.
const postFromPopup = (popup: Popup | object, data: unknown, origin = ORIGIN) => {
  const event = new MessageEvent('message', { data, origin });
  Object.defineProperty(event, 'source', { value: popup });
  window.dispatchEvent(event);
};

const report = (status: string, connectionId = 'conn_1') =>
  new FakeBroadcastChannel(AI_CONNECTOR_SIGN_IN_CHANNEL).postMessage({
    connection_id: connectionId,
    status,
    type: 'va.connector.oauth.result',
  });

describe('createPopupAuthorizer', () => {
  let popup: Popup;
  let open: ReturnType<typeof vi.fn>;
  const decline = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    vi.useFakeTimers();
    FakeBroadcastChannel.channels = [];
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
    popup = createPopup();
    open = vi.fn(() => popup);
    vi.spyOn(window, 'open').mockImplementation(open as unknown as typeof window.open);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const authorizer = () =>
    createPopupAuthorizer({ decline, returnUrl: 'http://localhost:5173/connected' });

  it('opens the launch page synchronously and hands off the token once it is ready', async () => {
    const connecting = authorizer().connect(call());
    expect(open).toHaveBeenCalledWith(LAUNCH, expect.any(String), expect.any(String));

    postFromPopup(popup, { type: 'va.connector.oauth.ready' });
    expect(popup.postMessage).toHaveBeenCalledWith(
      { handoff_token: 'tok', type: 'va.connector.oauth.handoff' },
      ORIGIN,
    );

    report('connected');
    await expect(connecting).resolves.toBe(true);
    // the channel is closed once done
    expect(FakeBroadcastChannel.channels[0].closed).toBe(true);
  });

  it('hands off once, and only to the popup from the launch page’s origin', async () => {
    const connecting = authorizer().connect(call());
    postFromPopup({}, { type: 'va.connector.oauth.ready' });
    postFromPopup(
      popup,
      { type: 'va.connector.oauth.ready' },
      'https://evil.example.com',
    );
    postFromPopup(popup, { type: 'something.else' });
    expect(popup.postMessage).not.toHaveBeenCalled();

    postFromPopup(popup, { type: 'va.connector.oauth.ready' });
    postFromPopup(popup, { type: 'va.connector.oauth.ready' });
    expect(popup.postMessage).toHaveBeenCalledTimes(1);

    report('denied');
    await expect(connecting).resolves.toBe(false);
  });

  it('ignores outcomes before the handoff and unknown statuses', async () => {
    const connecting = authorizer().connect(call());
    report('connected');
    postFromPopup(popup, { type: 'va.connector.oauth.ready' });
    report('bogus');
    report('account_mismatch');
    await expect(connecting).resolves.toBe(false);
  });

  it('resolves false when the person closes the popup and is back on the page', async () => {
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    const connecting = authorizer().connect(call());
    postFromPopup(popup, { type: 'va.connector.oauth.ready' });
    popup.closed = true;
    vi.advanceTimersByTime(500);
    await expect(connecting).resolves.toBe(false);
  });

  it('keeps waiting while a provider page severs the popup and the person is still in it', async () => {
    const hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    let settled = false;
    const connecting = authorizer().connect(call());
    void connecting.then(() => {
      settled = true;
    });
    postFromPopup(popup, { type: 'va.connector.oauth.ready' });
    // Google's consent page severs the popup, which then reads as closed.
    popup.closed = true;
    vi.advanceTimersByTime(5_000);
    await Promise.resolve();
    expect(settled).toBe(false);

    hasFocus.mockReturnValue(true);
    vi.advanceTimersByTime(500);
    await expect(connecting).resolves.toBe(false);
  });

  it('rejects when the browser blocks the popup', async () => {
    open.mockReturnValue(null);
    const connecting = authorizer().connect(call());
    await expect(connecting).rejects.toBeInstanceOf(AIConnectorSignInError);
    await expect(connecting).rejects.toMatchObject({ reason: 'blocked' });
  });

  it('rejects and closes the popup when the launch page never asks', async () => {
    const connecting = authorizer().connect(call());
    vi.advanceTimersByTime(15_000);
    await expect(connecting).rejects.toMatchObject({ reason: 'unreachable' });
    expect(popup.close).toHaveBeenCalled();
  });

  it('gives up once the sign-in expires', async () => {
    vi.setSystemTime(new Date('2026-11-02T10:00:00Z'));
    const connecting = authorizer().connect(
      call({ expiresAt: Date.parse('2026-11-02T10:01:00Z') }),
    );
    postFromPopup(popup, { type: 'va.connector.oauth.ready' });
    vi.advanceTimersByTime(59_000);
    let settled = false;
    connecting.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    vi.advanceTimersByTime(1_000);
    await expect(connecting).resolves.toBe(false);
  });

  it('rejects a call with no handoff token without opening anything', async () => {
    await expect(
      authorizer().connect(call({ handoffToken: undefined })),
    ).rejects.toMatchObject({ reason: 'unavailable' });
    expect(open).not.toHaveBeenCalled();
  });

  it('exposes the return URL and declines through the app', async () => {
    const instance = authorizer();
    expect(instance.returnUrl).toBe('http://localhost:5173/connected');
    await instance.decline(call());
    expect(decline).toHaveBeenCalledWith(call());
  });
});

describe('completeConnectorSignIn', () => {
  beforeEach(() => {
    FakeBroadcastChannel.channels = [];
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reports the outcome over the channel and closes the popup', () => {
    const close = vi.spyOn(window, 'close').mockImplementation(() => undefined);
    const listener = new FakeBroadcastChannel(AI_CONNECTOR_SIGN_IN_CHANNEL);
    const received = vi.fn();
    listener.onmessage = ({ data }) => received(data);

    const result = completeConnectorSignIn({
      search: '?connection_id=conn_1&status=connected',
    });

    expect(result).toEqual({ connectionId: 'conn_1', status: 'connected' });
    expect(received).toHaveBeenCalledWith({
      connection_id: 'conn_1',
      status: 'connected',
      type: 'va.connector.oauth.result',
    });
    expect(close).toHaveBeenCalled();
  });

  it('reads nothing from a query without an outcome', () => {
    const close = vi.spyOn(window, 'close').mockImplementation(() => undefined);
    expect(completeConnectorSignIn({ search: '?status=connected' })).toBeNull();
    expect(readConnectorSignInResult('?connection_id=a&status=whatever')).toBeNull();
    expect(readConnectorSignInResult('?connection_id=a%20b&status=failed')).toBeNull();
    expect(close).not.toHaveBeenCalled();
  });

  it('works end to end with the authorizer', async () => {
    vi.useFakeTimers();
    const popup = createPopup();
    vi.spyOn(window, 'open').mockImplementation(
      (() => popup) as unknown as typeof window.open,
    );
    vi.spyOn(window, 'close').mockImplementation(() => undefined);
    const connecting = createPopupAuthorizer({
      decline: () => Promise.resolve(),
      returnUrl: 'http://localhost/connected',
    }).connect(call());
    postFromPopup(popup, { type: 'va.connector.oauth.ready' });
    completeConnectorSignIn({ search: '?connection_id=conn_9&status=connected' });
    await expect(connecting).resolves.toBe(true);
    vi.useRealTimers();
  });
});

describe('AIClientIdentity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('creates a stable id and keeps it in localStorage', () => {
    localStorage.clear();
    const id = AIClientIdentity.installId();
    expect(id).toMatch(/^web-/);
    expect(AIClientIdentity.installId()).toBe(id);
    expect(localStorage.getItem('io.getstream.ai.client-id')).toBe(id);
  });

  it('reads an id kept from before', () => {
    localStorage.setItem('io.getstream.ai.client-id', 'web-kept');
    expect(AIClientIdentity.installId()).toBe('web-kept');
  });

  it('keeps the id in memory when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const id = AIClientIdentity.installId();
    expect(id).toMatch(/^web-/);
    expect(AIClientIdentity.installId()).toBe(id);
  });
});
