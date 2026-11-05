import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';

import {
  AIConnectorSignInError,
  AIMessageAttachment,
  AIMessageComposer,
  AIMessagePart,
  AIReasoning,
  AIReplyActions,
  AISuggestions,
  AIThinking,
  AIToolApproval,
  AIToolApprovalCard,
  type AIToolApprover,
  AIToolArguments,
  AIToolAuthorization,
  AIToolAuthorizationCard,
  type AIToolAuthorizer,
  AIToolCall,
  type AIToolCallPart,
  AITypingIndicator,
  parseMessagePart,
} from '..';
import { formatToolArguments } from '../MessageParts/toolArguments';
import { axe } from '../../../../axe-helper';
import { renderWithEnglish } from './renderWithEnglish';

const toolCall = (overrides: Partial<AIToolCallPart> = {}): AIToolCallPart => ({
  executor: 'server',
  id: 'call_1',
  name: 'get_weather',
  status: 'running',
  ...overrides,
});

describe('AIToolCall', () => {
  it('names the call from its display title, else its name', () => {
    const { rerender } = renderWithEnglish(
      <AIToolCall part={toolCall({ displayTitle: 'Checking the weather' })} />,
    );
    expect(screen.getByText('Checking the weather')).toBeInTheDocument();
    rerender(<AIToolCall part={toolCall()} />);
    expect(screen.getByText('get weather')).toBeInTheDocument();
  });

  it.each([
    ['awaiting_approval', 'Waiting for approval'],
    ['awaiting_authorization', 'Waiting for you to sign in'],
    ['awaiting_client', 'Waiting for the device'],
    ['failed', "Didn't complete"],
    ['cancelled', 'Cancelled'],
  ])('says what a %s call waits for', (status, detail) => {
    renderWithEnglish(<AIToolCall part={toolCall({ status })} />);
    expect(screen.getByText(detail)).toBeInTheDocument();
  });

  it('prefers the summary, and says a declined call was declined', () => {
    const { rerender } = renderWithEnglish(
      <AIToolCall part={toolCall({ status: 'failed', summary: 'No network' })} />,
    );
    expect(screen.getByText('No network')).toBeInTheDocument();
    rerender(
      <AIToolCall
        part={toolCall({
          approval: { decision: 'declined', title: 'Share?' },
          status: 'cancelled',
        })}
      />,
    );
    expect(screen.getByText('Declined')).toBeInTheDocument();
  });

  it('shows how long a finished call took', () => {
    const { container, rerender } = renderWithEnglish(
      <AIToolCall part={toolCall({ durationMs: 420, status: 'completed' })} />,
    );
    expect(container).toHaveTextContent('0.4s');
    rerender(<AIToolCall part={toolCall({ durationMs: 65_000, status: 'completed' })} />);
    expect(container).toHaveTextContent('1m 5s');
    rerender(<AIToolCall part={toolCall({ durationMs: 65_000, status: 'running' })} />);
    expect(container).not.toHaveTextContent('1m 5s');
  });
});

describe('AIToolApprovalCard', () => {
  it('asks with the reason as a sentence and the agent’s own button titles', () => {
    const onDecide = vi.fn();
    renderWithEnglish(
      <AIToolApprovalCard
        approval={{
          allowTitle: 'Share',
          message: 'Only your city is shared.',
          reason: 'to check the local weather',
          title: 'Share your location?',
        }}
        onDecide={onDecide}
      />,
    );
    expect(screen.getByText('To check the local weather.')).toBeInTheDocument();
    expect(screen.getByText('Only your city is shared.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    fireEvent.click(screen.getByRole('button', { name: "Don't Allow" }));
    expect(onDecide.mock.calls).toEqual([[true], [false]]);
  });
});

describe('AIToolApproval arguments', () => {
  const awaiting = (args: unknown) =>
    toolCall({
      approval: { title: 'Send a Slack message?' },
      arguments: args,
      status: 'awaiting_approval',
      targetUserId: 'alex',
    });
  const approver: AIToolApprover = {
    clientId: 'web-1',
    decide: () => new Promise<void>(() => undefined),
    userId: 'alex',
  };

  it('shows short arguments as JSON under the question', async () => {
    const { container } = renderWithEnglish(
      <AIToolApproval
        approver={approver}
        part={awaiting({ channel: '#travel', text: 'Off to Ohrid' })}
      />,
    );
    const shown = screen.getByRole('group', { name: 'What it sends' });
    expect(shown).toHaveTextContent('"channel": "#travel"');
    expect(shown.querySelector('details')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('collapses long arguments under a summary the person opens', async () => {
    const { container } = renderWithEnglish(
      <AIToolApproval
        approver={approver}
        part={awaiting({
          checkIn: '2026-11-14',
          checkOut: '2026-11-16',
          guests: ['Alex', 'Sam'],
          hotel: 'Hotel Riviera',
          room: 'double',
        })}
      />,
    );
    const details = container.querySelector('details.str-chat__ai-tool-arguments');
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');
    expect(screen.getByText('What it sends').tagName).toBe('SUMMARY');
    expect(details).toHaveTextContent('"hotel": "Hotel Riviera"');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('reads JSON sent as text, and shows nothing for a call without arguments', () => {
    expect(formatToolArguments('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(formatToolArguments('plain words')).toBe('plain words');
    for (const none of [undefined, null, '', {}, []]) {
      expect(formatToolArguments(none)).toBeUndefined();
    }
    renderWithEnglish(<AIToolApproval approver={approver} part={awaiting(undefined)} />);
    expect(screen.getByText('Send a Slack message?')).toBeInTheDocument();
    expect(screen.queryByText('What it sends')).not.toBeInTheDocument();
  });

  it('shows arguments that can’t be JSON as words', () => {
    const circular: Record<string, unknown> = { name: 'loop' };
    circular.self = circular;
    expect(formatToolArguments(circular)).toBe('[object Object]');
    expect(formatToolArguments({ count: BigInt(1) })).toBe('[object Object]');
  });

  it('shows a call’s arguments on their own with AIToolArguments', () => {
    const { container, rerender } = renderWithEnglish(
      <AIToolArguments args={{ channel: '#travel' }} className='my-arguments' />,
    );
    expect(screen.getByRole('group', { name: 'What it sends' })).toHaveClass(
      'str-chat__ai-tool-arguments',
      'my-arguments',
    );
    rerender(<AIToolArguments args={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the approver’s own preview, or none when it returns null', () => {
    const part = awaiting({ channel: '#travel', text: 'Off to Ohrid' });
    const argumentsPreview = vi.fn((call: AIToolCallPart) => {
      const { channel, text } = call.arguments as { channel: string; text: string };
      return <p>{`Posts “${text}” in ${channel}`}</p>;
    });
    const { rerender } = renderWithEnglish(
      <AIToolApproval approver={{ ...approver, argumentsPreview }} part={part} />,
    );
    expect(argumentsPreview).toHaveBeenCalledWith(part);
    expect(screen.getByText('Posts “Off to Ohrid” in #travel')).toBeInTheDocument();
    expect(screen.queryByText(/"channel"/)).not.toBeInTheDocument();
    rerender(
      <AIToolApproval
        approver={{ ...approver, argumentsPreview: () => null }}
        part={part}
      />,
    );
    expect(screen.queryByText(/#travel/)).not.toBeInTheDocument();
    rerender(
      <AIToolApproval
        approver={{ ...approver, argumentsPreview: () => undefined }}
        part={part}
      />,
    );
    expect(screen.getByRole('group', { name: 'What it sends' })).toBeInTheDocument();
  });

  it('hands the preview to a custom question', () => {
    renderWithEnglish(
      <AIToolApproval approver={approver} part={awaiting({ channel: '#travel' })}>
        {(approval, _state, _decide, argumentsPreview) => (
          <section aria-label={approval.title}>{argumentsPreview}</section>
        )}
      </AIToolApproval>,
    );
    expect(
      screen.getByRole('region', { name: 'Send a Slack message?' }),
    ).toHaveTextContent('"channel": "#travel"');
  });
});

describe('AIToolAuthorization', () => {
  const signIn = parseMessagePart({
    authorization: {
      handoff_token: 'tok',
      provider: 'linear',
      provider_name: 'Linear',
      title: 'Connect Linear',
      type: 'oauth',
      url: 'https://router.example.com/launch/abc',
    },
    id: 'call_2',
    name: 'linear_create_issue',
    status: 'awaiting_authorization',
    target_user_id: 'alex',
    type: 'ai_tool_call',
  })?.toolCall as AIToolCallPart;

  const approverWith = (authorizer?: AIToolAuthorizer): AIToolApprover => ({
    authorizer,
    clientId: 'web-1',
    decide: vi.fn(() => Promise.resolve()),
    userId: 'alex',
  });

  it('asks nothing without an authorizer, or of another person', () => {
    const { container, rerender } = renderWithEnglish(
      <AIToolAuthorization approver={approverWith()} part={signIn} />,
    );
    expect(container).toBeEmptyDOMElement();
    rerender(
      <AIToolAuthorization
        approver={{
          ...approverWith({ connect: vi.fn(), decline: vi.fn() }),
          userId: 'sam',
        }}
        part={signIn}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('connects, and lets the person try again when the popup closes', async () => {
    let finish: (connected: boolean) => void = () => undefined;
    const connect = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithEnglish(
      <AIToolAuthorization
        approver={approverWith({ connect, decline: vi.fn() })}
        part={signIn}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    expect(connect).toHaveBeenCalledWith(signIn);
    expect(screen.getByRole('button', { name: 'Connecting…' })).toBeDisabled();
    // Not now stays available while the sign-in is open
    expect(screen.getByRole('button', { name: 'Not now' })).toBeEnabled();

    await act(() => {
      finish(false);
      return Promise.resolve();
    });
    expect(screen.getByRole('button', { name: 'Connect' })).toBeEnabled();
  });

  it('keeps connecting once connected, until the step changes', async () => {
    renderWithEnglish(
      <AIToolAuthorization
        approver={approverWith({
          connect: () => Promise.resolve(true),
          decline: vi.fn(),
        })}
        part={signIn}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    await act(() => Promise.resolve());
    expect(screen.getByRole('button', { name: 'Connecting…' })).toBeDisabled();
  });

  it('says when the popup was blocked or the sign-in could not open', async () => {
    const connect = vi
      .fn()
      .mockRejectedValueOnce(new AIConnectorSignInError('blocked'))
      .mockRejectedValueOnce(new AIConnectorSignInError('unreachable'));
    renderWithEnglish(
      <AIToolAuthorization
        approver={approverWith({ connect, decline: vi.fn() })}
        part={signIn}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    await act(() => Promise.resolve());
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your browser blocked the sign-in window. Allow pop-ups and try again.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    await act(() => Promise.resolve());
    expect(screen.getByRole('alert')).toHaveTextContent(
      "The sign-in couldn't be opened. Try again.",
    );
  });

  it('declines, and lets the person answer again when that fails', async () => {
    const decline = vi.fn().mockRejectedValueOnce(new Error('offline'));
    renderWithEnglish(
      <AIToolAuthorization
        approver={approverWith({ connect: vi.fn(), decline })}
        part={signIn}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(decline).toHaveBeenCalledWith(signIn);
    expect(screen.getByRole('button', { name: 'Not now' })).toBeDisabled();
    await act(() => Promise.resolve());
    expect(screen.getByRole('alert')).toHaveTextContent(
      "Your answer couldn't be sent. Try again.",
    );
    expect(screen.getByRole('button', { name: 'Not now' })).toBeEnabled();
  });

  it.each([
    ['connected', 'Connected to Linear'],
    ['declined', 'Not connected'],
    ['failed', "The sign-in didn't complete."],
    ['expired', 'This sign-in has expired.'],
  ])('says how a %s sign-in ended, without buttons', (status, outcome) => {
    renderWithEnglish(
      <AIToolAuthorizationCard
        authorization={{ ...signIn.authorization!, status }}
        onConnect={vi.fn()}
        onDecline={vi.fn()}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(outcome);
    expect(screen.queryByRole('button', { name: 'Connect' })).not.toBeInTheDocument();
  });

  it('can no longer be opened past its expiry', () => {
    renderWithEnglish(
      <AIToolAuthorizationCard
        authorization={{ ...signIn.authorization!, expiresAt: Date.now() - 1 }}
        onConnect={vi.fn()}
        onDecline={vi.fn()}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('This sign-in has expired.');
    expect(screen.queryByRole('button', { name: 'Connect' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Not now' })).toBeEnabled();
  });
});

describe('AIMessagePart', () => {
  it('shows a placeholder for a step it cannot show', () => {
    renderWithEnglish(
      <AIMessagePart part={parseMessagePart({ id: 'x', type: 'ai_citation' })!} />,
    );
    expect(screen.getByText("A step this app version can't show")).toBeInTheDocument();
  });
});

describe('AIReasoning', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts the seconds while thinking, and folds when done', () => {
    vi.useFakeTimers();
    const { rerender } = renderWithEnglish(
      <AIReasoning isThinking text={'First thought.\n\n## Plan\nSecond thought.'} />,
    );
    const header = screen.getByRole('button', { name: /Thinking…/ });
    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Plan')).toContainHTML('strong');

    act(() => vi.advanceTimersByTime(7_000));
    expect(header).toHaveTextContent('Thinking… 7s');

    rerender(
      <AIReasoning
        duration={12}
        isThinking={false}
        summary='Planned the day'
        text={'First thought.\n\n## Plan\nSecond thought.'}
      />,
    );
    expect(header).toHaveTextContent('Thought for 12s');
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(header).toHaveTextContent('Planned the day');

    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows a step’s live text, else its preview', () => {
    const part = {
      durationMs: 2000,
      id: 'r1',
      preview: 'The opening',
      status: 'completed',
    };
    const { rerender } = renderWithEnglish(
      <AIReasoning
        initiallyExpanded
        part={part}
        reasoningText={() => 'The whole thought'}
      />,
    );
    expect(screen.getByText('The whole thought')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thought for 2s/ })).toBeInTheDocument();
    rerender(<AIReasoning initiallyExpanded part={part} />);
    expect(screen.getByText('The opening')).toBeInTheDocument();
  });

  it('says Thinking… for thinking that shows nothing yet', () => {
    renderWithEnglish(<AIThinking />);
    expect(screen.getByRole('button', { name: 'Thinking…' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});

describe('AIReplyActions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('copies the reply', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    renderWithEnglish(<AIReplyActions text='The answer' />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('The answer');
    await act(() => Promise.resolve());
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('shares with the system share sheet, else copies', async () => {
    const share = vi.fn(() => Promise.resolve());
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText }, share });
    const { unmount } = renderWithEnglish(<AIReplyActions text='The answer' />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(share).toHaveBeenCalledWith({ text: 'The answer' });
    expect(writeText).not.toHaveBeenCalled();
    unmount();

    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText },
      share: undefined,
    });
    renderWithEnglish(<AIReplyActions text='The answer' />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(writeText).toHaveBeenCalledWith('The answer');
    await act(() => Promise.resolve());
  });

  it('rates, and takes a rating back', () => {
    const onRate = vi.fn();
    const onRegenerate = vi.fn();
    const { rerender } = renderWithEnglish(
      <AIReplyActions onRate={onRate} onRegenerate={onRegenerate} text='x' />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Bad response' }));
    expect(onRate).toHaveBeenLastCalledWith('negative');
    rerender(<AIReplyActions onRate={onRate} rating='negative' text='x' />);
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Bad response' }));
    expect(onRate).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('button', { name: 'Regenerate' })).not.toBeInTheDocument();
  });
});

describe('AIMessageComposer.ChatOptions', () => {
  const options = [
    {
      description: 'Takes longer, for harder questions',
      id: 'think',
      shortTitle: 'Think',
      title: 'Think harder',
    },
    { id: 'search', title: 'Search the web' },
  ];

  it('picks an option from the menu, shows it as a chip and submits it', () => {
    const onSelectedChange = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      return new FormData(event.currentTarget).get('chat_option');
    });
    renderWithEnglish(
      <AIMessageComposer onSubmit={onSubmit}>
        <AIMessageComposer.ChatOptions
          name='chat_option'
          onSelectedChange={onSelectedChange}
          options={options}
        />
        <AIMessageComposer.SubmitButton />
      </AIMessageComposer>,
    );
    const menuButton = screen.getByRole('button', { name: 'Chat options' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(menuButton);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Takes longer, for harder questions')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitemradio', { name: /Think harder/ }));
    expect(onSelectedChange).toHaveBeenLastCalledWith(options[0]);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByText('Think')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveReturnedWith('think');

    fireEvent.click(screen.getByRole('button', { name: 'Remove option: Think' }));
    expect(onSelectedChange).toHaveBeenLastCalledWith(null);
    expect(screen.queryByText('Think')).not.toBeInTheDocument();
  });

  it('closes the menu with Escape', () => {
    renderWithEnglish(
      <AIMessageComposer>
        <AIMessageComposer.ChatOptions options={options} />
      </AIMessageComposer>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Chat options' }));
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('follows the composer’s disabled state', () => {
    renderWithEnglish(
      <AIMessageComposer disabled>
        <AIMessageComposer.ChatOptions options={options} />
      </AIMessageComposer>,
    );
    expect(screen.getByRole('button', { name: 'Chat options' })).toBeDisabled();
  });
});

describe('AIMessageAttachment', () => {
  it('links no script a message sends as an attachment URL', () => {
    // spelt in parts, since a literal script URL is what the linter forbids
    const script = (code: string) => ['javascript', code].join(':');
    renderWithEnglish(
      <>
        <AIMessageAttachment
          attachment={{ kind: 'file', name: 'plan.pdf', url: script('alert(1)') }}
        />
        <AIMessageAttachment
          attachment={{ kind: 'image', name: 'cat.png', url: script('alert(2)') }}
        />
      </>,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('plan.pdf')).toBeInTheDocument();
  });

  it('shows a photo just picked from its data URL, and links a web file', () => {
    const photo = 'data:image/jpeg;base64,AAAA';
    renderWithEnglish(
      <>
        <AIMessageAttachment
          attachment={{ kind: 'image', name: 'cat.jpg', url: photo }}
        />
        <AIMessageAttachment
          attachment={{
            kind: 'file',
            name: 'plan.pdf',
            size: 2400,
            url: 'https://cdn.example.com/plan.pdf',
          }}
        />
      </>,
    );
    expect(screen.getByAltText('cat.jpg')).toHaveAttribute('src', photo);
    expect(screen.getByRole('link', { name: /plan\.pdf/ })).toHaveAttribute(
      'href',
      'https://cdn.example.com/plan.pdf',
    );
    expect(screen.getByText('PDF · 2.34 kB')).toBeInTheDocument();
  });
});

describe('AISuggestions and AITypingIndicator', () => {
  it('hands the picked suggestion on', () => {
    const onSelect = vi.fn();
    renderWithEnglish(
      <AISuggestions onSelect={onSelect} suggestions={['Plan my day']} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Plan my day' }));
    expect(onSelect).toHaveBeenCalledWith('Plan my day');
  });

  it('labels what the agent is doing', () => {
    renderWithEnglish(<AITypingIndicator text='Working on your calendar' />);
    expect(screen.getByRole('status')).toHaveTextContent('Working on your calendar');
  });
});
