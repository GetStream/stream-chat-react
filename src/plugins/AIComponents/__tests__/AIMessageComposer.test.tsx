import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { AIMessageComposer } from '..';

const Composer = ({
  label,
  onSubmit,
}: {
  label: string;
  onSubmit?: (e: React.FormEvent) => void;
}) => (
  <AIMessageComposer aria-label={label} onSubmit={onSubmit}>
    <AIMessageComposer.TextInput aria-label={`${label} input`} />
    <AIMessageComposer.SpeechToTextButton />
    <AIMessageComposer.SubmitButton />
  </AIMessageComposer>
);

describe('AIMessageComposer', () => {
  it('keeps state independent between two composers', () => {
    render(
      <>
        <Composer label='a' />
        <Composer label='b' />
      </>,
    );
    fireEvent.change(screen.getByLabelText('a input'), { target: { value: 'first' } });
    expect(screen.getByLabelText('a input')).toHaveValue('first');
    expect(screen.getByLabelText('b input')).toHaveValue('');
  });

  it('keeps its own class next to a className it is given', () => {
    const { container } = render(<AIMessageComposer className='floating' />);
    expect(container.querySelector('form')).toHaveClass(
      'str-chat__ai-message-composer__form',
      'floating',
    );
  });

  it('renders without throwing when the Web Speech API is unavailable', () => {
    expect('SpeechRecognition' in window).toBe(false);
    expect(() => render(<Composer label='c' />)).not.toThrow();
  });

  it('keeps a disabled composer disabled after a form reset', () => {
    const { container } = render(
      <AIMessageComposer disabled>
        <AIMessageComposer.TextInput aria-label='message' />
      </AIMessageComposer>,
    );
    const input = screen.getByLabelText('message');
    expect(input).toBeDisabled();

    fireEvent.reset(container.querySelector('form') as HTMLFormElement);
    expect(input).toBeDisabled();
  });

  it('clears the text on form reset', () => {
    const { container } = render(<Composer label='d' />);
    fireEvent.change(screen.getByLabelText('d input'), { target: { value: 'draft' } });
    fireEvent.reset(container.querySelector('form') as HTMLFormElement);
    expect(screen.getByLabelText('d input')).toHaveValue('');
  });

  it('holds several lines, and sends on Enter but not Shift+Enter', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(<Composer label='e' onSubmit={onSubmit} />);
    const input = screen.getByLabelText('e input');

    expect(input.tagName).toBe('TEXTAREA');
    fireEvent.change(input, { target: { value: 'first line\nsecond line' } });
    expect(input).toHaveValue('first line\nsecond line');

    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not send while an input method is still composing', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(<Composer label='f' onSubmit={onSubmit} />);

    fireEvent.keyDown(screen.getByLabelText('f input'), {
      isComposing: true,
      key: 'Enter',
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  describe('layout', () => {
    it('stacks its parts by default', () => {
      const { container } = render(<AIMessageComposer />);
      expect(container.querySelector('form')).not.toHaveClass(
        'str-chat__ai-message-composer__form--inline',
      );
    });

    it('puts the text and the controls on one line with layout="inline"', () => {
      const { container } = render(
        <AIMessageComposer className='floating' layout='inline'>
          <AIMessageComposer.TextInput />
          <AIMessageComposer.SubmitButton />
        </AIMessageComposer>,
      );
      expect(container.querySelector('form')).toHaveClass(
        'str-chat__ai-message-composer__form',
        'str-chat__ai-message-composer__form--inline',
        'floating',
      );
    });
  });

  describe('Actions', () => {
    it('renders a row for the controls, with its own class next to a given one', () => {
      render(
        <AIMessageComposer>
          <AIMessageComposer.Actions className='mine' data-testid='actions'>
            <AIMessageComposer.SubmitButton />
          </AIMessageComposer.Actions>
        </AIMessageComposer>,
      );
      const actions = screen.getByTestId('actions');
      expect(actions).toHaveClass('str-chat__ai-message-composer__actions', 'mine');
      expect(actions).toContainElement(screen.getByRole('button', { name: 'Send' }));
    });
  });

  describe('StopButton', () => {
    it('calls onClick without submitting the form', () => {
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
      const onClick = vi.fn();
      render(
        <AIMessageComposer onSubmit={onSubmit}>
          <AIMessageComposer.StopButton onClick={onClick} />
        </AIMessageComposer>,
      );
      const stop = screen.getByRole('button', { name: 'Stop AI Generation' });
      expect(stop).toHaveAttribute('type', 'button');
      expect(stop).toHaveClass(
        'str-chat__ai-message-composer__round-button',
        'str-chat__ai-message-composer__round-button--stop',
      );

      fireEvent.click(stop);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('stays enabled in a disabled composer, since that is when a reply runs', () => {
      render(
        <AIMessageComposer disabled>
          <AIMessageComposer.SubmitButton />
          <AIMessageComposer.StopButton />
        </AIMessageComposer>,
      );
      expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Stop AI Generation' })).toBeEnabled();
    });

    it('can still be disabled on its own', () => {
      render(
        <AIMessageComposer>
          <AIMessageComposer.StopButton disabled />
        </AIMessageComposer>,
      );
      expect(screen.getByRole('button', { name: 'Stop AI Generation' })).toBeDisabled();
    });

    it('shows its children in place of the stop icon', () => {
      render(
        <AIMessageComposer>
          <AIMessageComposer.StopButton>Stop</AIMessageComposer.StopButton>
        </AIMessageComposer>,
      );
      expect(
        screen.getByRole('button', { name: 'Stop AI Generation' }),
      ).toHaveTextContent('Stop');
    });
  });
});
