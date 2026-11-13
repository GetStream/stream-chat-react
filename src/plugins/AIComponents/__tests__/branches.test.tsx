import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import {
  AIBranchSwitcher,
  AIConversation,
  type AIConversationUserMessageProps,
  type AIMessage,
  AIReplyActions,
  AIUserMessage,
} from '..';
import { axe } from '../../../../axe-helper';

const user = (id: string, text: string, extra: Partial<AIMessage> = {}): AIMessage => ({
  id,
  role: 'user',
  text,
  ...extra,
});
const reply = (id: string, text: string, extra: Partial<AIMessage> = {}): AIMessage => ({
  id,
  role: 'assistant',
  text,
  ...extra,
});

const previous = () => screen.getByRole('button', { name: 'Previous version' });
const next = () => screen.getByRole('button', { name: 'Next version' });

describe('AIBranchSwitcher', () => {
  it('shows which version shows, out of how many', () => {
    render(
      <AIBranchSwitcher count={3} index={2} onNext={vi.fn()} onPrevious={vi.fn()} />,
    );
    expect(screen.getByRole('group', { name: 'Version 2 of 3' })).toHaveTextContent(
      '2/3',
    );
  });

  it('renders nothing while there is one version', () => {
    const { container } = render(
      <AIBranchSwitcher count={1} index={1} onNext={vi.fn()} onPrevious={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('disables each arrow at its end, and calls the other', () => {
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    const { rerender } = render(
      <AIBranchSwitcher count={3} index={1} onNext={onNext} onPrevious={onPrevious} />,
    );
    expect(previous()).toBeDisabled();
    expect(next()).toBeEnabled();
    fireEvent.click(previous());
    fireEvent.click(next());
    expect(onPrevious).not.toHaveBeenCalled();
    expect(onNext).toHaveBeenCalledTimes(1);

    rerender(
      <AIBranchSwitcher count={3} index={3} onNext={onNext} onPrevious={onPrevious} />,
    );
    expect(previous()).toBeEnabled();
    expect(next()).toBeDisabled();
    fireEvent.click(previous());
    expect(onPrevious).toHaveBeenCalledTimes(1);

    rerender(
      <AIBranchSwitcher count={3} index={2} onNext={onNext} onPrevious={onPrevious} />,
    );
    expect(previous()).toBeEnabled();
    expect(next()).toBeEnabled();
  });

  it('disables an arrow that has nothing to call', () => {
    render(<AIBranchSwitcher count={3} index={2} />);
    expect(previous()).toBeDisabled();
    expect(next()).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <AIBranchSwitcher count={2} index={1} onNext={vi.fn()} onPrevious={vi.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('AIReplyActions branch', () => {
  it('leads the reply’s actions with the switcher when it has several versions', () => {
    render(
      <AIReplyActions
        branch={{ count: 2, index: 2, onNext: vi.fn(), onPrevious: vi.fn() }}
        text='Hi'
      />,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Reply actions' });
    expect(
      within(toolbar).getByRole('group', { name: 'Version 2 of 2' }),
    ).toBeInTheDocument();
    expect(next()).toBeDisabled();
    expect(previous()).toBeEnabled();
  });

  it('shows no switcher for a reply with one version, or without a branch', () => {
    const { rerender } = render(
      <AIReplyActions branch={{ count: 1, index: 1 }} text='Hi' />,
    );
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    rerender(<AIReplyActions text='Hi' />);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });
});

describe('AIUserMessage', () => {
  it('opens an editor filled with the text, and saves the edit', () => {
    const onSaveEdit = vi.fn();
    render(<AIUserMessage onSaveEdit={onSaveEdit} text='What time is it?' />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const input = screen.getByRole('textbox', { name: 'Edit message' });
    expect(input).toHaveValue('What time is it?');
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: 'What day is it?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSaveEdit).toHaveBeenCalledWith('What day is it?');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('What time is it?')).toBeInTheDocument();
  });

  it('cancels the edit without saving', () => {
    const onSaveEdit = vi.fn();
    render(<AIUserMessage onSaveEdit={onSaveEdit} text='Hi' />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSaveEdit).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });

  it('saves on Enter, starts a line on Shift+Enter, and cancels on Escape', () => {
    const onSaveEdit = vi.fn();
    render(<AIUserMessage onSaveEdit={onSaveEdit} text='Hi' />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(onSaveEdit).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSaveEdit).toHaveBeenCalledWith('Hello');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(onSaveEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('keeps the editor open on an Escape that ends an IME composition', () => {
    render(<AIUserMessage onSaveEdit={vi.fn()} text='Hi' />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.keyDown(screen.getByRole('textbox'), { isComposing: true, key: 'Escape' });
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('returns focus to the edit button after saving', async () => {
    render(<AIUserMessage onSaveEdit={vi.fn()} text='Hi' />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus(),
    );
  });

  it('does not save the text unchanged', () => {
    const onSaveEdit = vi.fn();
    render(<AIUserMessage onSaveEdit={onSaveEdit} text='Hi' />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const input = screen.getByRole('textbox');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.change(input, { target: { value: ' Hi \n' } });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSaveEdit).not.toHaveBeenCalled();
  });

  it('closes the editor once saving goes away, such as while the agent answers', () => {
    const { rerender } = render(<AIUserMessage onSaveEdit={vi.fn()} text='Hi' />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } });

    rerender(<AIUserMessage text='Hi' />);
    rerender(<AIUserMessage onSaveEdit={vi.fn()} text='Hi' />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('does not save an empty edit', () => {
    const onSaveEdit = vi.fn();
    render(<AIUserMessage onSaveEdit={onSaveEdit} text='Hi' />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSaveEdit).not.toHaveBeenCalled();
  });

  it('keeps calling onEdit without onSaveEdit, and prefers onSaveEdit when both are passed', () => {
    const onEdit = vi.fn();
    const { rerender } = render(<AIUserMessage onEdit={onEdit} text='Hi' />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    rerender(<AIUserMessage onEdit={onEdit} onSaveEdit={vi.fn()} text='Hi' />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('closes the editor when another version shows', () => {
    const branch = { count: 2, index: 2, onNext: vi.fn(), onPrevious: vi.fn() };
    const { rerender } = render(
      <AIUserMessage branch={branch} onSaveEdit={vi.fn()} text='Hi' />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    rerender(
      <AIUserMessage
        branch={{ ...branch, index: 1 }}
        onSaveEdit={vi.fn()}
        text='Hello'
      />,
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows the switcher when the question has several versions', () => {
    const onPrevious = vi.fn();
    const { rerender } = render(
      <AIUserMessage branch={{ count: 3, index: 3, onPrevious }} text='Hi' />,
    );
    expect(screen.getByRole('group', { name: 'Version 3 of 3' })).toBeInTheDocument();
    expect(next()).toBeDisabled();
    fireEvent.click(previous());
    expect(onPrevious).toHaveBeenCalledTimes(1);

    rerender(<AIUserMessage branch={{ count: 1, index: 1 }} text='Hi' />);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('has no axe violations while editing', async () => {
    const { container } = render(
      <AIUserMessage
        branch={{ count: 2, index: 1, onNext: vi.fn() }}
        onSaveEdit={vi.fn()}
        text='Hi'
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('AIConversation branches and in-place edits', () => {
  it('passes replyActions’ branch to the reply’s actions', () => {
    const onPrevious = vi.fn();
    render(
      <AIConversation
        messages={[user('u1', 'Hi'), reply('a1', 'Hello')]}
        replyActions={() => ({ branch: { count: 2, index: 2, onPrevious } })}
      />,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Reply actions' });
    fireEvent.click(within(toolbar).getByRole('button', { name: 'Previous version' }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('passes userMessageActions to the default user message', () => {
    const onEdit = vi.fn();
    const userMessageActions = vi.fn((message: AIMessage) =>
      message.branch?.of === 'question'
        ? {
            branch: { count: message.branch.count, index: message.branch.index },
            onSaveEdit: (text: string) => onEdit(message.id, text),
          }
        : undefined,
    );
    render(
      <AIConversation
        messages={[
          user('u1', 'Hi'),
          reply('a1', 'Hello'),
          user('u2', 'Plan my day', { branch: { count: 2, index: 2, of: 'question' } }),
          reply('a2', 'Sure'),
        ]}
        userMessageActions={userMessageActions}
      />,
    );
    expect(userMessageActions).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u2' }),
    );
    expect(screen.getByRole('group', { name: 'Version 2 of 2' })).toBeInTheDocument();
    // Only the edited question offers an edit.
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit message' }), {
      target: { value: 'Plan my week' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onEdit).toHaveBeenCalledWith('u2', 'Plan my week');
  });

  it('hands a custom UserMessage branch and onSaveEdit', () => {
    const UserMessage = vi.fn<(props: AIConversationUserMessageProps) => null>(
      () => null,
    );
    const onEdit = vi.fn();
    const branch = { count: 2, index: 1 };
    render(
      <AIConversation
        messages={[user('u1', 'Hi'), reply('a1', 'Hello')]}
        UserMessage={UserMessage}
        userMessageActions={() => ({ branch, onSaveEdit: onEdit })}
      />,
    );
    expect(UserMessage.mock.calls[0][0]).toMatchObject({
      branch,
      onSaveEdit: onEdit,
      text: 'Hi',
    });
  });
});
