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

  it('renders without throwing when the Web Speech API is unavailable', () => {
    expect('SpeechRecognition' in window).toBe(false);
    expect(() => render(<Composer label='c' />)).not.toThrow();
  });
});
