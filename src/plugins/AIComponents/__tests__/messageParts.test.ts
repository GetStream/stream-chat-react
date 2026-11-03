import {
  isAuthorizationExpired,
  isAwaitingApproval,
  isAwaitingAuthorization,
  isAwaitingClient,
  isDeclined,
  isSupportedPart,
  isToolCallFinished,
  parseMessagePart,
  parseMessageParts,
} from '../MessageParts';
import type { AIToolCallPart } from '../MessageParts';

// Shaped as the router writes them (acceleration/internal/conversation/parts.go).
const reasoning = {
  duration_ms: 4200,
  finished_at: '2026-11-02T10:00:04Z',
  id: 'r1',
  preview: 'Let me check the calendar first.',
  started_at: '2026-11-02T10:00:00Z',
  status: 'completed',
  summary: 'Checked the calendar',
  type: 'ai_reasoning',
  v: 1,
};

const approvalCall = {
  approval: {
    allow_title: 'Share',
    decline_title: 'Not now',
    message: 'Only your city is shared.',
    reason: 'to check the local weather',
    title: 'Share your location?',
  },
  arguments: { reason: 'to check the local weather' },
  display_title: 'Checking your location',
  executor: 'client',
  id: 'call_1',
  name: 'get_location',
  status: 'awaiting_approval',
  target_client_id: 'web-1',
  target_user_id: 'alex',
  type: 'ai_tool_call',
  v: 1,
};

const authorizationCall = {
  authorization: {
    expires_at: '2026-11-02T10:10:00.123Z',
    handoff_token: 'tok',
    message: 'Juno needs your Linear account to file the issue.',
    provider: 'linear',
    provider_name: 'Linear',
    title: 'Connect Linear',
    type: 'oauth',
    url: 'https://router.example.com/v1/agents/connectors/oauth/launch/abc',
  },
  display_title: 'Filing a Linear issue',
  executor: 'server',
  id: 'call_2',
  name: 'linear_create_issue',
  status: 'awaiting_authorization',
  target_user_id: 'alex',
  type: 'ai_tool_call',
  v: 1,
};

describe('parseMessageParts', () => {
  it('reads the steps in order and skips other attachments', () => {
    const parts = parseMessageParts([
      reasoning,
      { image_url: 'https://example.com/a.png', type: 'image' },
      approvalCall,
      authorizationCall,
    ]);
    expect(parts.map((part) => part.id)).toEqual(['r1', 'call_1', 'call_2']);
    expect(parts.map((part) => part.kind)).toEqual([
      'ai_reasoning',
      'ai_tool_call',
      'ai_tool_call',
    ]);
    expect(parts.every(isSupportedPart)).toBe(true);
  });

  it('reads a reasoning step', () => {
    expect(parseMessagePart(reasoning)?.reasoning).toEqual({
      durationMs: 4200,
      id: 'r1',
      preview: 'Let me check the calendar first.',
      status: 'completed',
      summary: 'Checked the calendar',
    });
  });

  it('reads a tool call with its approval', () => {
    const call = parseMessagePart(approvalCall)?.toolCall;
    expect(call).toMatchObject({
      approval: {
        allowTitle: 'Share',
        declineTitle: 'Not now',
        message: 'Only your city is shared.',
        reason: 'to check the local weather',
        title: 'Share your location?',
      },
      arguments: { reason: 'to check the local weather' },
      displayTitle: 'Checking your location',
      executor: 'client',
      id: 'call_1',
      name: 'get_location',
      status: 'awaiting_approval',
      targetClientId: 'web-1',
      targetUserId: 'alex',
    });
  });

  it('reads a tool call with its authorization', () => {
    const call = parseMessagePart(authorizationCall)?.toolCall;
    expect(call?.authorization).toEqual({
      expiresAt: Date.parse('2026-11-02T10:10:00.123Z'),
      handoffToken: 'tok',
      message: 'Juno needs your Linear account to file the issue.',
      provider: 'linear',
      providerName: 'Linear',
      status: undefined,
      title: 'Connect Linear',
      type: 'oauth',
      url: 'https://router.example.com/v1/agents/connectors/oauth/launch/abc',
    });
  });

  it('defaults missing fields', () => {
    const part = parseMessagePart({ type: 'ai_tool_call' }, 3);
    expect(part?.id).toBe('ai_tool_call-3');
    expect(part?.version).toBe(1);
    expect(part?.toolCall).toMatchObject({
      executor: 'server',
      name: '',
      status: 'running',
    });
    expect(parseMessagePart({ type: 'ai_reasoning' })?.reasoning?.status).toBe(
      'completed',
    );
  });

  it('reads fields of the wrong type as missing', () => {
    const call = parseMessagePart({
      approval: { message: 'no title' },
      authorization: { title: 'Connect', url: 'ftp://example.com/launch' },
      duration_ms: '12',
      id: 7,
      name: ['x'],
      status: '',
      type: 'ai_tool_call',
    })?.toolCall;
    expect(call).toMatchObject({ durationMs: undefined, id: 'ai_tool_call-0', name: '' });
    expect(call?.status).toBe('running');
    // a question with no title asks nothing, and a sign-in needs a web page
    expect(call?.approval).toBeUndefined();
    expect(call?.authorization).toBeUndefined();
  });

  it('keeps steps it cannot read, without a typed view', () => {
    const newer = parseMessagePart({ id: 'x', type: 'ai_tool_call', v: 2 });
    expect(newer?.toolCall).toBeUndefined();
    expect(newer && isSupportedPart(newer)).toBe(false);
    const custom = parseMessagePart({ id: 'c', type: 'ai_citation', url: 'u' });
    expect(custom?.kind).toBe('ai_citation');
    expect(custom?.payload).toMatchObject({ url: 'u' });
    expect(custom && isSupportedPart(custom)).toBe(false);
  });

  it('ignores what is not an AI step', () => {
    expect(parseMessageParts(undefined)).toEqual([]);
    expect(parseMessageParts([null, 'x', { type: 'file' }, {}])).toEqual([]);
  });
});

describe('tool call addressing', () => {
  const call = (overrides: Partial<AIToolCallPart>): AIToolCallPart => ({
    ...(parseMessagePart(approvalCall)?.toolCall as AIToolCallPart),
    ...overrides,
  });

  it('asks the targeted person on the targeted install', () => {
    expect(isAwaitingApproval(call({}), 'alex', 'web-1')).toBe(true);
    expect(isAwaitingApproval(call({}), 'alex', 'ios-2')).toBe(false);
    expect(isAwaitingApproval(call({}), 'sam', 'web-1')).toBe(false);
  });

  it('asks a server tool on any of the person’s installs', () => {
    const server = call({ executor: 'server', targetClientId: undefined });
    expect(isAwaitingApproval(server, 'alex', 'web-1')).toBe(true);
    expect(isAwaitingApproval(server, 'alex', 'android-9')).toBe(true);
  });

  it('asks nothing once answered or without a question', () => {
    expect(isAwaitingApproval(call({ status: 'running' }), 'alex', 'web-1')).toBe(false);
    expect(isAwaitingApproval(call({ approval: undefined }), 'alex', 'web-1')).toBe(
      false,
    );
  });

  it('waits for this device to run a client tool', () => {
    const device = call({ status: 'awaiting_client' });
    expect(isAwaitingClient(device, 'alex', 'web-1')).toBe(true);
    expect(isAwaitingClient(device, 'alex', 'web-2')).toBe(false);
    expect(isAwaitingClient(call({ executor: 'server' }), 'alex', 'web-1')).toBe(false);
  });

  it('asks the targeted person to sign in from any install', () => {
    const signIn = parseMessagePart(authorizationCall)?.toolCall as AIToolCallPart;
    expect(isAwaitingAuthorization(signIn, 'alex')).toBe(true);
    expect(isAwaitingAuthorization(signIn, 'sam')).toBe(false);
    expect(isAwaitingAuthorization({ ...signIn, status: 'completed' }, 'alex')).toBe(
      false,
    );
  });

  it('knows a declined call', () => {
    const declinedApproval = call({
      approval: { decision: 'declined', title: 'Share?' },
      status: 'cancelled',
    });
    expect(isDeclined(declinedApproval)).toBe(true);
    const signIn = parseMessagePart(authorizationCall)?.toolCall as AIToolCallPart;
    expect(
      isDeclined({
        ...signIn,
        authorization: { ...signIn.authorization!, status: 'declined' },
      }),
    ).toBe(true);
    expect(isDeclined(call({}))).toBe(false);
  });

  it('knows finished statuses and expired sign-ins', () => {
    expect(['completed', 'failed', 'cancelled'].every(isToolCallFinished)).toBe(true);
    expect(isToolCallFinished('awaiting_client')).toBe(false);
    const signIn = parseMessagePart(authorizationCall)?.toolCall
      ?.authorization as NonNullable<AIToolCallPart['authorization']>;
    expect(isAuthorizationExpired(signIn, signIn.expiresAt! - 1)).toBe(false);
    expect(isAuthorizationExpired(signIn, signIn.expiresAt!)).toBe(true);
    expect(isAuthorizationExpired({ ...signIn, status: 'connected' }, Infinity)).toBe(
      false,
    );
  });
});
