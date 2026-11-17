import React from 'react';
import type { Attachment, LocalMessage } from 'stream-chat';
import { act, fireEvent, render, screen } from '@testing-library/react';

import {
  AIConversation,
  type AIConversationAssistantMessageProps,
  type AIConversationUserMessageProps,
  type AIMessage,
  type AIToolApprover,
  fromStreamMessage,
  parseMessageParts,
} from '..';
import { AIPendingMessageTracker, turnsOf } from '../Conversation/entries';

const user = (id: string, text: string): AIMessage => ({ id, role: 'user', text });
const reply = (id: string, text: string, extra: Partial<AIMessage> = {}): AIMessage => ({
  id,
  role: 'assistant',
  text,
  ...extra,
});

const turnsIn = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('.str-chat__ai-conversation__turn')].map(
    (turn) => turn.dataset.turnId,
  );

describe('AIConversation', () => {
  it('shows the empty content while there are no messages', () => {
    render(<AIConversation emptyContent={<p>Ask me anything</p>} messages={[]} />);
    expect(screen.getByText('Ask me anything')).toBeInTheDocument();
  });

  it('groups the messages into turns, each starting with a question', () => {
    const { container } = render(
      <AIConversation
        footer={<p>footer</p>}
        messages={[
          reply('a0', 'Hi, I am Juno.'),
          user('u1', 'What time is it?'),
          reply('a1', 'It is noon.'),
          user('u2', 'And the weather?'),
          reply('a2', 'Sunny.'),
        ]}
      />,
    );
    expect(turnsIn(container)).toEqual(['a0', 'u1', 'u2']);
    const latest = container.querySelector('.str-chat__ai-conversation__turn--latest');
    expect(latest).toHaveAttribute('data-turn-id', 'u2');
    expect(latest).toHaveTextContent('And the weather?');
    expect(latest).toHaveTextContent('footer');
    expect(screen.getAllByText('footer')).toHaveLength(1);
  });

  it('shows a pending message with the agent thinking, until its reply starts', () => {
    const history = [user('u1', 'Hello'), reply('a1', 'Hi!')];
    const pending = { id: 'local-1', text: 'Plan my day' };
    const { container, rerender } = render(
      <AIConversation messages={history} pendingMessage={pending} />,
    );
    expect(screen.getByText('Plan my day')).toBeInTheDocument();
    expect(screen.getByText('Thinking…')).toBeInTheDocument();
    const pendingTurn = container.querySelector('[data-turn-id="local-1"]');

    // Stream's copy arrives with another id: it takes over the pending row, under its key.
    rerender(
      <AIConversation
        messages={[...history, user('stream-u2', 'Plan my day')]}
        pendingMessage={pending}
      />,
    );
    expect(screen.getAllByText('Plan my day')).toHaveLength(1);
    expect(container.querySelector('[data-turn-id="local-1"]')).toBe(pendingTurn);
    expect(screen.getByText('Thinking…')).toBeInTheDocument();

    // A reply being written that shows nothing yet: still thinking.
    rerender(
      <AIConversation
        messages={[
          ...history,
          user('stream-u2', 'Plan my day'),
          reply('a2', '', { isGenerating: true }),
        ]}
        pendingMessage={pending}
      />,
    );
    expect(screen.getByText('Thinking…')).toBeInTheDocument();

    rerender(
      <AIConversation
        messages={[
          ...history,
          user('stream-u2', 'Plan my day'),
          reply('a2', 'Here is your plan.', { isGenerating: true }),
        ]}
      />,
    );
    expect(screen.queryByText('Thinking…')).not.toBeInTheDocument();
    expect(screen.getByText('Here is your plan.')).toBeInTheDocument();
    expect(container.querySelector('[data-turn-id="local-1"]')).toBe(pendingTurn);
  });

  it('finds the copy of a pending message by its id', () => {
    const pending = { id: 'm-2', text: 'Draft' };
    const { rerender } = render(
      <AIConversation messages={[user('m-1', 'Draft')]} pendingMessage={pending} />,
    );
    // the earlier message saying the same is not its copy
    expect(screen.getAllByText('Draft')).toHaveLength(2);
    rerender(
      <AIConversation
        messages={[user('m-1', 'Draft'), user('m-2', 'Draft')]}
        pendingMessage={pending}
      />,
    );
    expect(screen.getAllByText('Draft')).toHaveLength(2);
  });

  it('shows the agent thinking when told to', () => {
    render(<AIConversation isThinking messages={[user('u1', 'Hi')]} />);
    expect(screen.getByRole('button', { name: /Thinking…/ })).toBeInTheDocument();
  });

  it('shows reply actions under finished replies only', () => {
    const onRate = vi.fn();
    const { rerender } = render(
      <AIConversation
        messages={[
          user('u1', 'One'),
          reply('a1', 'Done.'),
          user('u2', 'Two'),
          reply('a2', 'Writing', { isGenerating: true }),
        ]}
        replyActions={(message, { isLatestReply }) => ({
          onRate: (rating) => onRate(message.id, rating, isLatestReply),
          rating: null,
        })}
      />,
    );
    const toolbars = screen.getAllByRole('toolbar', { name: 'Reply actions' });
    expect(toolbars).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Good response' }));
    expect(onRate).toHaveBeenCalledWith('a1', 'positive', false);

    rerender(
      <AIConversation
        messages={[user('u1', 'One'), reply('a1', 'Done.')]}
        ReplyActions={null}
      />,
    );
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  it('shows a new rating when the messages stay the same', () => {
    const messages = [user('u1', 'One'), reply('a1', 'Done.')];
    const rated = (rating: 'positive' | null) => (
      <AIConversation
        messages={messages}
        replyActions={() => ({ onRate: vi.fn(), rating })}
      />
    );
    const { rerender } = render(rated(null));
    rerender(rated('positive'));
    expect(screen.getByRole('button', { name: 'Good response' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders messages through the slots', () => {
    const UserMessage = ({ text }: AIConversationUserMessageProps) => <p>user:{text}</p>;
    const AssistantMessage = ({ message, text }: AIConversationAssistantMessageProps) => (
      <p>
        agent:{message.id}:{text}
      </p>
    );
    render(
      <AIConversation
        AssistantMessage={AssistantMessage}
        messages={[user('u1', 'Hi'), reply('a1', 'Hello')]}
        ReplyActions={() => <p>actions</p>}
        UserMessage={UserMessage}
      />,
    );
    expect(screen.getByText('user:Hi')).toBeInTheDocument();
    expect(screen.getByText('agent:a1:Hello')).toBeInTheDocument();
    expect(screen.getByText('actions')).toBeInTheDocument();
  });

  it('shows reasoning, tool calls and approvals of a reply', async () => {
    let fail = true;
    const decide = vi.fn(() =>
      fail ? Promise.reject(new Error('offline')) : new Promise<void>(() => undefined),
    );
    const approver: AIToolApprover = { clientId: 'web-1', decide, userId: 'alex' };
    const parts = parseMessageParts([
      { duration_ms: 3000, id: 'r1', preview: 'Thinking about the weather.', status: 'completed', type: 'ai_reasoning', v: 1 },
      {
        approval: { title: 'Share your location?' },
        display_title: 'Checking your location',
        executor: 'client',
        id: 'call_1',
        name: 'get_location',
        status: 'awaiting_approval',
        target_client_id: 'web-1',
        target_user_id: 'alex',
        type: 'ai_tool_call',
        v: 1,
      },
    ]); // prettier-ignore
    render(
      <AIConversation
        approver={approver}
        messages={[
          user('u1', 'Weather?'),
          reply('a1', '', { isGenerating: true, parts }),
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: /Thought for 3s/ })).toBeInTheDocument();
    expect(screen.getByText('Checking your location')).toBeInTheDocument();
    expect(screen.getByText('Waiting for approval')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
    expect(decide).toHaveBeenCalledWith(parts[1].toolCall, true);
    expect(screen.getByRole('button', { name: 'Allow' })).toBeDisabled();
    await act(() => Promise.resolve());
    expect(screen.getByRole('alert')).toHaveTextContent(
      "Your answer couldn't be sent. Try again.",
    );

    fail = false;
    fireEvent.click(screen.getByRole('button', { name: "Don't Allow" }));
    expect(decide).toHaveBeenLastCalledWith(parts[1].toolCall, false);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Don't Allow" })).toBeDisabled();
  });

  describe('loading older messages', () => {
    let trigger: (isIntersecting: boolean) => void;
    // Whether the spinner is in view, which a real observer reports when it starts watching.
    let inView = false;

    beforeEach(() => {
      vi.useFakeTimers();
      inView = false;
      vi.stubGlobal(
        'IntersectionObserver',
        class {
          private callback: (entries: { isIntersecting: boolean }[]) => void;
          constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
            this.callback = callback;
            trigger = (isIntersecting) => {
              inView = isIntersecting;
              callback([{ isIntersecting }]);
            };
          }
          disconnect() {}
          observe() {
            if (inView) this.callback([{ isIntersecting: true }]);
          }
          unobserve() {}
        },
      );
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    it('loads once the spinner has been in view a moment', () => {
      const loadOlderMessages = vi.fn(() => Promise.resolve());
      const { rerender } = render(
        <AIConversation
          loadOlderMessages={loadOlderMessages}
          messages={[user('u1', 'Hi'), reply('a1', 'Hello')]}
        />,
      );
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      act(() => trigger(true));
      act(() => trigger(false));
      act(() => vi.advanceTimersByTime(300));
      expect(loadOlderMessages).not.toHaveBeenCalled();

      act(() => trigger(true));
      act(() => vi.advanceTimersByTime(300));
      expect(loadOlderMessages).toHaveBeenCalledTimes(1);

      rerender(
        <AIConversation
          messages={[user('u0', 'Earlier'), user('u1', 'Hi'), reply('a1', 'Hello')]}
        />,
      );
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('asks again after a load that failed, while the spinner stays in view', async () => {
      const loadOlderMessages = vi
        .fn<() => Promise<void>>()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValue(undefined);
      render(
        <AIConversation
          loadOlderMessages={loadOlderMessages}
          messages={[user('u1', 'Hi'), reply('a1', 'Hello')]}
        />,
      );
      act(() => trigger(true));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(loadOlderMessages).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000 + 300);
      });
      expect(loadOlderMessages).toHaveBeenCalledTimes(2);
    });
  });
});

describe('fromStreamMessage', () => {
  it('adapts a reply with its steps and attachments', () => {
    const reasoningText = vi.fn(() => 'The whole thought');
    // stream-chat keeps custom message and attachment data under `custom`.
    const message = fromStreamMessage(
      {
        attachments: [
          {
            custom: { id: 'r1', status: 'streaming', v: 1 } as Attachment['custom'],
            type: 'ai_reasoning',
          },
          {
            custom: {},
            image_url: 'https://cdn.example.com/a.jpg',
            title: 'a.jpg',
            type: 'image',
          },
          {
            asset_url: 'https://cdn.example.com/plan.pdf',
            custom: { file_size: 2400, mime_type: 'application/pdf' },
            title: 'plan.pdf',
            type: 'file',
          },
        ],
        custom: { ai_generated: true, generating: true },
        id: 'm1',
        text: 'Working on it',
      },
      { reasoningText },
    );
    expect(message).toMatchObject({
      attachments: [
        { kind: 'image', name: 'a.jpg', url: 'https://cdn.example.com/a.jpg' },
        {
          kind: 'file',
          mimeType: 'application/pdf',
          name: 'plan.pdf',
          size: 2400,
          url: 'https://cdn.example.com/plan.pdf',
        },
      ],
      id: 'm1',
      isGenerating: true,
      role: 'assistant',
      text: 'Working on it',
    });
    expect(message.parts?.map((part) => part.id)).toEqual(['r1']);
    expect(message.reasoningText?.('r1')).toBe('The whole thought');
    expect(reasoningText).toHaveBeenCalledWith('m1', 'r1');
  });

  it('reads ai_generated and generating at the top level of a message from the API', () => {
    expect(
      fromStreamMessage({
        ai_generated: true,
        attachments: [],
        generating: false,
        id: 'm2',
        text: 'Done',
      }),
    ).toMatchObject({ isGenerating: false, role: 'assistant' });
  });

  it('takes a LocalMessage, and hands isAssistant the same type', () => {
    const local = {
      attachments: [],
      created_at: 0,
      custom: {},
      id: 'm3',
      status: 'received',
      text: 'From the agent',
      type: 'regular',
      updated_at: 0,
      user: { id: 'juno' },
    } as unknown as LocalMessage;
    expect(
      fromStreamMessage(local, { isAssistant: (message) => message.user?.id === 'juno' }),
    ).toMatchObject({ role: 'assistant', text: 'From the agent' });
  });

  it('reads which version a message is, and its response, from custom.support_branch', () => {
    const support_branch = {
      count: 3,
      index: 2,
      of: 'question',
      parent_response_id: 'resp-0',
      question_response_id: 'resp-1',
      response_id: 'resp-1',
    };
    expect(
      fromStreamMessage({
        attachments: [],
        custom: { support_branch },
        id: 'u1',
        text: 'Hi',
      }),
    ).toMatchObject({
      branch: { count: 3, index: 2, of: 'question' },
      responseId: 'resp-1',
      role: 'user',
    });
    // A message from the API has its custom fields at the top level.
    const fromAPI = fromStreamMessage({
      ai_generated: true,
      attachments: [],
      id: 'a1',
      support_branch: { count: 2, index: 1, of: 'reply', response_id: 'resp-2' },
      text: 'Hello',
    });
    expect(fromAPI.branch).toEqual({ count: 2, index: 1, of: 'reply' });
    expect(fromAPI.responseId).toBe('resp-2');
  });

  it('reads the message a copy was re-sent from, from custom.resent_from or the top level', () => {
    const read = (fields: Record<string, unknown>) =>
      fromStreamMessage({ attachments: [], id: 'c1', text: 'Hi', ...fields });
    expect(read({ custom: { resent_from: 'u1' } }).resentFrom).toBe('u1');
    // stream-chat 9, and a message from the API, keep custom fields at the top level.
    expect(read({ ai_generated: true, resent_from: 'a1' }).resentFrom).toBe('a1');
    expect(read({ resent_from: 'u1' })).toMatchObject({ resentFrom: 'u1', role: 'user' });
    for (const malformed of ['', 42, null, {}, ['u1']]) {
      expect(read({ custom: { resent_from: malformed } })).not.toHaveProperty(
        'resentFrom',
      );
    }
    expect(read({})).not.toHaveProperty('resentFrom');
  });

  it('leaves out a malformed support_branch, keeping a good response id', () => {
    const read = (support_branch: unknown) =>
      fromStreamMessage({
        attachments: [],
        custom: { support_branch },
        id: 'm',
        text: '',
      });
    for (const malformed of [
      null,
      'reply',
      [],
      { count: 2, index: 1 },
      { count: 2, index: 1, of: 'thread' },
      { count: 2, index: 3, of: 'reply' },
      { count: 2, index: 0, of: 'reply' },
      { count: 2, index: 1.5, of: 'reply' },
      { count: '2', index: 1, of: 'reply' },
      { count: 0, index: 0, of: 'question' },
      { count: Number.NaN, index: 1, of: 'reply' },
    ]) {
      const message = read(malformed);
      expect(message).not.toHaveProperty('branch');
      expect(message).not.toHaveProperty('responseId');
    }
    const message = read({ count: 2, index: 5, of: 'reply', response_id: 'resp-1' });
    expect(message).not.toHaveProperty('branch');
    expect(message.responseId).toBe('resp-1');
    expect(read({ count: 2, index: 1, of: 'reply', response_id: 42 })).not.toHaveProperty(
      'responseId',
    );
    expect(read({ count: 2, index: 1, of: 'reply', response_id: '' })).not.toHaveProperty(
      'responseId',
    );
  });

  it('adapts the person’s message', () => {
    expect(fromStreamMessage({ attachments: [], id: 'u1', text: 'Hi' })).toMatchObject({
      isGenerating: false,
      parts: [],
      role: 'user',
    });
  });
});

describe('AIPendingMessageTracker', () => {
  it('keeps a turn that starts with a reply when older messages load above it', () => {
    const starts = new Set<string>();
    const tracker = new AIPendingMessageTracker();
    const page = [
      reply('a1', 'It is noon.'),
      user('u2', 'And the weather?'),
      reply('a2', 'Sunny.'),
    ];
    expect(turnsOf(tracker.entries(page), starts).map((turn) => turn.id)).toEqual([
      'a1',
      'u2',
    ]);

    const older = [user('u1', 'What time is it?'), ...page];
    expect(turnsOf(tracker.entries(older), starts).map((turn) => turn.id)).toEqual([
      'u1',
      'a1',
      'u2',
    ]);
  });

  it('takes the copy of a message on its way that arrives in the update that first passes it', () => {
    const tracker = new AIPendingMessageTracker();
    const history = [user('u1', 'Hello'), reply('a1', 'Hi!')];
    tracker.entries(history);
    const pending = { id: 'local-1', text: 'Plan my day' };
    const entries = tracker.entries(
      [...history, user('stream-u2', 'Plan my day')],
      pending,
    );
    expect(entries.map((entry) => entry.id)).toEqual(['u1', 'a1', 'local-1']);
    expect(entries.filter((entry) => entry.pending)).toHaveLength(0);
  });

  it('takes the copy of a message on its way from a window of the same length', () => {
    const tracker = new AIPendingMessageTracker();
    tracker.entries([user('u1', 'Hello'), reply('a1', 'Hi!')]);
    const pending = { id: 'local-1', text: 'Plan my day' };
    // A reconnect reloads the latest page: as many messages, the newest one the copy.
    const entries = tracker.entries(
      [reply('a1', 'Hi!'), user('stream-u2', 'Plan my day')],
      pending,
    );
    expect(entries.map((entry) => entry.id)).toEqual(['a1', 'local-1']);
  });

  it('takes no older question for the copy of a message on its way when it mounts with one', () => {
    const history = [user('u1', 'Hello'), reply('a1', 'Hi!'), user('u2', 'Plan my day')];
    const pending = { id: 'local-3', text: 'Plan my week' };
    const entries = new AIPendingMessageTracker().entries(history, pending);
    expect(entries.map((entry) => entry.id)).toEqual(['u1', 'a1', 'u2', 'local-3']);
    expect(entries[3].pending).toBe(pending);
  });

  it('shows a question once when its copy arrives in the update that first passes it', () => {
    const history = [user('u1', 'Hello'), reply('a1', 'Hi!')];
    const { rerender } = render(<AIConversation messages={history} />);
    rerender(
      <AIConversation
        messages={[...history, user('stream-u2', 'Plan my day')]}
        pendingMessage={{ id: 'local-1', text: 'Plan my day' }}
      />,
    );
    expect(screen.getAllByText('Plan my day')).toHaveLength(1);
  });
});
