import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import {
  AIConversation,
  AIConversationController,
  type AIConversationControllerOptions,
  type AIConversationFeed,
  type AIConversationTransport,
  type AIMessage,
  AIMessageComposer,
} from '..';

const user = (id: string, text: string): AIMessage => ({ id, role: 'user', text });
const reply = (id: string, text: string, extra: Partial<AIMessage> = {}): AIMessage => ({
  id,
  role: 'assistant',
  text,
  ...extra,
});

const settle = async () => {
  await act(async () => {
    for (let index = 0; index < 20; index++) await Promise.resolve();
  });
};

const controllers: AIConversationController[] = [];

afterEach(() => {
  controllers.splice(0).forEach((controller) => controller.dispose());
});

// A transport the test drives: what it sends, stops and rates, and the messages it reports.
const conversationOf = (
  messages: AIMessage[],
  options: Omit<AIConversationControllerOptions, 'transport'> = {},
  // What the transport does besides, such as switching versions.
  extra: Pick<AIConversationTransport, 'switchBranch'> = {},
) => {
  let feed: AIConversationFeed | undefined;
  const transport = {
    connect: (connected: AIConversationFeed) => {
      feed = connected;
      connected.updateMessages(messages);
    },
    loadOlderMessages: vi.fn(() => Promise.resolve()),
    rate: vi.fn(() => Promise.resolve()),
    send: vi.fn(() => Promise.resolve()),
    stop: vi.fn(() => Promise.resolve()),
    ...extra,
  } satisfies AIConversationTransport;
  const controller = new AIConversationController({ transport, ...options });
  controllers.push(controller);
  const update = async (next: AIMessage[]) => {
    act(() => feed?.updateMessages(next));
    await settle();
  };
  const olderMessages = async (hasOlderMessages: boolean) => {
    act(() => feed?.updateHasOlderMessages(hasOlderMessages));
    await settle();
  };
  return { controller, olderMessages, transport, update };
};

const thinking = () => screen.queryByText('Thinking…');

describe('AIConversation with a controller', () => {
  it('shows the conversation as the controller has it', async () => {
    const history = [user('u1', 'Hello'), reply('a1', 'Hi!')];
    const { controller, update } = conversationOf(history);
    render(<AIConversation conversation={controller} />);
    expect(screen.getByText('Hi!')).toBeInTheDocument();
    expect(thinking()).not.toBeInTheDocument();

    act(() => controller.send({ text: 'Plan my day' }));
    await settle();
    expect(screen.getByText('Plan my day')).toBeInTheDocument();
    expect(thinking()).toBeInTheDocument();

    await update([
      ...history,
      user('u2', 'Plan my day'),
      reply('a2', 'Here is your plan.', { isGenerating: true }),
    ]);
    expect(thinking()).not.toBeInTheDocument();
    expect(screen.getAllByText('Plan my day')).toHaveLength(1);
  });

  it('shows the agent thinking while a reply is written again', async () => {
    const { controller } = conversationOf([user('u1', 'Hello'), reply('a1', 'Hi!')]);
    render(<AIConversation conversation={controller} />);

    act(() => controller.regenerate(reply('a1', 'Hi!')));
    await settle();

    expect(screen.queryByText('Hi!')).not.toBeInTheDocument();
    expect(thinking()).toBeInTheDocument();
  });

  it('stops showing the agent thinking once stopped, with the message still on its way', async () => {
    const { controller, transport } = conversationOf([
      user('u1', 'Hello'),
      reply('a1', 'Hi!'),
    ]);
    render(<AIConversation conversation={controller} />);
    act(() => controller.send({ text: 'Plan my day' }));
    await settle();
    expect(thinking()).toBeInTheDocument();

    act(() => controller.stop());
    await settle();

    expect(screen.getByText('Plan my day')).toBeInTheDocument();
    expect(thinking()).not.toBeInTheDocument();
    expect(transport.stop).toHaveBeenCalledTimes(1);
  });

  it('offers the controller’s actions under replies and on the person’s latest message', async () => {
    const { controller, transport } = conversationOf([
      user('u1', 'Lisbon'),
      reply('a1', 'Lisbon it is'),
      user('u2', 'Porto'),
      reply('a2', 'Porto it is'),
    ]);
    render(<AIConversation conversation={controller} />);

    // Regenerating the latest reply only, and editing the person's latest message only.
    expect(screen.getAllByRole('button', { name: 'Regenerate' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1);

    fireEvent.click(screen.getAllByRole('button', { name: 'Good response' })[0]);
    await settle();
    expect(transport.rate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a1' }),
      'positive',
    );
    expect(screen.getAllByRole('button', { name: 'Good response' })[0]).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(controller.editingMessage?.id).toBe('u2');
    expect(controller.composer.getLatestValue().text).toBe('Porto');

    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
    await settle();
    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'regenerate', text: 'Porto' }),
    );
    // The agent is answering.
    expect(screen.queryByRole('button', { name: 'Regenerate' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('offers what the app allows', () => {
    const { controller } = conversationOf([user('u1', 'Lisbon'), reply('a1', 'Done')], {
      actions: { edit: false, rate: false },
    });
    render(<AIConversation conversation={controller} />);

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Good response' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeInTheDocument();
  });

  it('takes reply actions of the app’s own over the controller’s', () => {
    const { controller } = conversationOf([user('u1', 'Lisbon'), reply('a1', 'Done')]);
    render(<AIConversation conversation={controller} replyActions={() => ({})} />);

    expect(
      screen.queryByRole('button', { name: 'Good response' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Regenerate' })).not.toBeInTheDocument();
  });

  it('loads older messages through the controller while there are any', async () => {
    const { controller, olderMessages } = conversationOf([
      user('u1', 'Hi'),
      reply('a1', 'Hello'),
    ]);
    render(<AIConversation conversation={controller} />);
    expect(
      screen.queryByRole('progressbar', { name: 'Loading older messages' }),
    ).not.toBeInTheDocument();

    await olderMessages(true);

    expect(
      screen.getByRole('progressbar', { name: 'Loading older messages' }),
    ).toBeInTheDocument();
  });

  it('gives tool calls the controller’s approver unless one is passed', () => {
    const approver = {
      clientId: 'web-1',
      decide: () => Promise.resolve(),
      userId: 'u_1',
    };
    const { controller } = conversationOf([user('u1', 'Hi')], { approver });
    expect(controller.approver).toBe(approver);
    // Renders with the controller's approver, and with one passed in its place.
    const { rerender } = render(<AIConversation conversation={controller} />);
    rerender(<AIConversation approver={approver} conversation={controller} />);
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });
});

const ComposerOf = ({
  conversation,
  onSubmit,
}: {
  conversation: AIConversationController;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
}) => (
  <AIMessageComposer conversation={conversation} onSubmit={onSubmit}>
    <AIMessageComposer.TextInput />
    <AIMessageComposer.ChatOptions options={[{ id: 'think', title: 'Think harder' }]} />
    <AIMessageComposer.FileInput name='attachments' />
    <AIMessageComposer.SubmitButton />
  </AIMessageComposer>
);

const textInput = () => screen.getByRole('textbox');

describe('AIMessageComposer with a controller', () => {
  it('sends what the person wrote through the controller, and empties the text', async () => {
    const { controller, transport } = conversationOf([]);
    render(<ComposerOf conversation={controller} />);

    fireEvent.change(textInput(), { target: { value: 'Plan my day' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await settle();

    expect(transport.send).toHaveBeenCalledTimes(1);
    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({ attachments: [], kind: 'message', text: 'Plan my day' }),
    );
    expect(textInput()).toHaveValue('');
    expect(controller.state.getLatestValue().pendingMessage?.text).toBe('Plan my day');
  });

  it('sends the files the person picked and the chat option, which stays picked', async () => {
    const { controller, transport } = conversationOf([]);
    render(<ComposerOf conversation={controller} />);
    const photo = new File(['photo'], 'alfama.jpg', { type: 'image/jpeg' });

    fireEvent.change(screen.getByLabelText('File upload'), {
      target: { files: [photo] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Chat options' }));
    fireEvent.click(await screen.findByRole('menuitemradio', { name: /Think harder/ }));
    fireEvent.change(textInput(), { target: { value: 'What is this?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await settle();

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [photo],
        chatOption: expect.objectContaining({ id: 'think' }),
        text: 'What is this?',
      }),
    );
    expect(controller.composer.getLatestValue().attachments).toEqual([]);
    expect(controller.composer.getLatestValue().chatOption?.id).toBe('think');
  });

  it('sends nothing when the app’s onSubmit prevents it', async () => {
    const { controller, transport } = conversationOf([]);
    render(
      <ComposerOf
        conversation={controller}
        onSubmit={(event) => event.preventDefault()}
      />,
    );

    fireEvent.change(textInput(), { target: { value: 'Plan my day' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await settle();

    expect(transport.send).not.toHaveBeenCalled();
    expect(textInput()).toHaveValue('Plan my day');
  });

  it('shows a stop button while the agent answers, which stops it', async () => {
    const { controller, transport, update } = conversationOf([user('u1', 'Hi')]);
    render(<ComposerOf conversation={controller} />);
    expect(screen.queryByRole('button', { name: 'Stop AI Generation' })).toBeNull();

    await update([user('u1', 'Hi'), reply('a1', 'Hel', { isGenerating: true })]);
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();

    // Enter doesn't send while the agent answers.
    fireEvent.change(textInput(), { target: { value: 'And then?' } });
    fireEvent.keyDown(textInput(), { key: 'Enter' });
    await settle();
    expect(transport.send).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Stop AI Generation' }));
    await settle();

    expect(transport.stop).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('edits the person’s message, says so, and cancels it', async () => {
    const { controller, transport } = conversationOf([
      user('u1', 'Lisbon'),
      reply('a1', 'Lisbon it is'),
    ]);
    render(
      <>
        <AIConversation conversation={controller} />
        <ComposerOf conversation={controller} />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(textInput()).toHaveValue('Lisbon');
    expect(textInput()).toHaveFocus();
    expect(screen.getByText('Editing')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel editing' }));
    expect(screen.queryByText('Editing')).not.toBeInTheDocument();
    expect(textInput()).toHaveValue('');
    expect(controller.editingMessage).toBeUndefined();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(textInput(), { target: { value: 'Porto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await settle();

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'edit',
        message: expect.objectContaining({ id: 'u1' }),
        text: 'Porto',
      }),
    );
    expect(screen.queryByText('Editing')).not.toBeInTheDocument();
  });
});

// A message with a version mark, as `fromStreamMessage` reads it: its branch, and its response.
const branched = (
  message: AIMessage,
  of: 'reply' | 'question',
  index: number,
  count: number,
): AIMessage => ({
  ...message,
  branch: { count, index, of },
  responseId: `r-${message.id}`,
});

const switcher = (name: string) => screen.getByRole('group', { name });
const previousVersion = (group: HTMLElement) =>
  within(group).getByRole('button', { name: 'Previous version' });
const nextVersion = (group: HTMLElement) =>
  within(group).getByRole('button', { name: 'Next version' });

describe('AIConversation with a controller whose transport switches versions', () => {
  const history = [
    branched(user('u1', 'Lisbon'), 'question', 2, 2),
    branched(reply('a1', 'Lisbon it is'), 'reply', 1, 3),
    user('u2', 'Porto'),
    reply('a2', 'Porto it is'),
  ];

  it('shows the switcher on replies and questions with several versions, and switches', async () => {
    const switchBranch = vi.fn(() => Promise.resolve());
    const { controller } = conversationOf(history, {}, { switchBranch });
    render(<AIConversation conversation={controller} />);

    expect(screen.getAllByRole('group', { name: /^Version / })).toHaveLength(2);
    const question = switcher('Version 2 of 2');
    const answer = switcher('Version 1 of 3');
    // The reply's under it, with its actions; the question's on the person's message.
    expect(answer.closest('[role="toolbar"]')).not.toBeNull();
    expect(question.closest('[role="toolbar"]')).toBeNull();
    expect(nextVersion(question)).toBeDisabled();
    expect(previousVersion(answer)).toBeDisabled();

    fireEvent.click(previousVersion(question));
    await settle();
    fireEvent.click(nextVersion(answer));
    await settle();

    expect(switchBranch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 'u1' }),
      'previous',
      expect.any(AbortSignal),
    );
    expect(switchBranch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: 'a1' }),
      'next',
      expect.any(AbortSignal),
    );
  });

  it('keeps sending while a switch is on its way, which gives up on it', async () => {
    const switchBranch = vi.fn<NonNullable<AIConversationTransport['switchBranch']>>(
      () => new Promise<void>(() => undefined),
    );
    const { controller, transport } = conversationOf(history, {}, { switchBranch });
    render(
      <>
        <AIConversation conversation={controller} />
        <AIMessageComposer conversation={controller}>
          <AIMessageComposer.TextInput />
          <AIMessageComposer.SubmitButton />
        </AIMessageComposer>
      </>,
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'And Porto?' } });

    fireEvent.click(nextVersion(switcher('Version 1 of 3')));
    await settle();

    // The switched reply's regenerate and the arrows wait; the rest stays.
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
    expect(screen.getAllByRole('button', { name: 'Regenerate' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(2);
    expect(previousVersion(switcher('Version 2 of 2'))).toBeDisabled();

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    await settle();

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'message', text: 'And Porto?' }),
    );
    expect(switchBranch.mock.calls[0][2]?.aborted).toBe(true);
    expect(controller.state.getLatestValue().isSwitchingBranch).toBe(false);
  });

  it('offers regenerating and editing every message, and disables the switcher while answering', async () => {
    const switchBranch = vi.fn(() => Promise.resolve());
    const { controller, transport } = conversationOf(history, {}, { switchBranch });
    render(<AIConversation conversation={controller} />);

    expect(screen.getAllByRole('button', { name: 'Regenerate' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('button', { name: 'Regenerate' })[0]);
    await settle();

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'regenerate',
        message: expect.objectContaining({ id: 'a1' }),
        text: 'Lisbon',
      }),
    );
    // Everything after the reply written again is left out until the new reply starts, and
    // the agent is answering.
    expect(screen.queryByText('Porto')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(previousVersion(switcher('Version 2 of 2'))).toBeDisabled();
  });

  it('edits the person’s messages in place', async () => {
    const { controller, transport } = conversationOf(
      history,
      {},
      { switchBranch: () => Promise.resolve() },
    );
    render(<AIConversation conversation={controller} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit message' }), {
      target: { value: 'Lisbon in May' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await settle();

    expect(controller.editingMessage).toBeUndefined();
    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'edit',
        message: expect.objectContaining({ id: 'u1' }),
        text: 'Lisbon in May',
      }),
    );
    expect(screen.getByText('Lisbon in May')).toBeInTheDocument();
    expect(screen.queryByText('Porto')).not.toBeInTheDocument();
  });

  it('shows a failed switch as the conversation’s error', async () => {
    const switchBranch = vi.fn(() => Promise.reject(new Error('No such version')));
    const { controller } = conversationOf(history, {}, { switchBranch });
    render(<AIConversation conversation={controller} />);

    fireEvent.click(nextVersion(switcher('Version 1 of 3')));
    await settle();

    expect(controller.state.getLatestValue().error?.message).toBe('No such version');
  });

  it('takes the app’s user-message actions over the controller’s', () => {
    const { controller } = conversationOf(
      history,
      {},
      { switchBranch: () => Promise.resolve() },
    );
    render(
      <AIConversation conversation={controller} userMessageActions={() => undefined} />,
    );

    expect(screen.getAllByRole('group', { name: /^Version / })).toHaveLength(1);
    expect(switcher('Version 1 of 3')).toBeInTheDocument();
  });

  it('shows no switcher and offers the latest only without switchBranch', () => {
    const { controller } = conversationOf(history);
    render(<AIConversation conversation={controller} />);

    expect(screen.queryByRole('group', { name: /^Version / })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Regenerate' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1);
  });
});

describe('AIConversationController in React', () => {
  it('stays connected under StrictMode when made and disposed in an effect', async () => {
    const connects: AIConversationFeed[] = [];
    const transport: AIConversationTransport = {
      connect: (feed) => {
        connects.push(feed);
        feed.updateMessages([user('u1', 'Hi')]);
      },
      send: () => Promise.resolve(),
      stop: () => Promise.resolve(),
    };
    const App = () => {
      const [conversation, setConversation] = React.useState<AIConversationController>();
      React.useEffect(() => {
        const controller = new AIConversationController({ transport });
        setConversation(controller);
        return () => controller.dispose();
      }, []);
      return conversation ? <AIConversation conversation={conversation} /> : null;
    };

    render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    await settle();

    expect(screen.getByText('Hi')).toBeInTheDocument();
    // The controller shown is the one whose feed is still connected.
    expect(connects[connects.length - 1].isConnected).toBe(true);
  });
});
