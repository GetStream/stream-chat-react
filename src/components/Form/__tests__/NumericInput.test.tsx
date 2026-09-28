import React from 'react';
import { render, screen } from '@testing-library/react';

import { NumericInput } from '../NumericInput';

const renderWithValue = (value: string) =>
  render(<NumericInput aria-label='Delay' onChange={() => undefined} value={value} />);

describe('NumericInput', () => {
  // The field used to carry a fixed `width`, so anything longer than the guess was cut off rather
  // than scrolled — `20000` read as `2000(`. Sizing is CSS, which jsdom does not lay out, so what
  // is pinned here is the mechanism: the `size` attribute tracking the value.
  it('sizes the field to its value', () => {
    const { rerender } = renderWithValue('5');
    expect(screen.getByRole('spinbutton')).toHaveAttribute('size', '2');

    rerender(
      <NumericInput aria-label='Delay' onChange={() => undefined} value='20000' />,
    );
    expect(screen.getByRole('spinbutton')).toHaveAttribute('size', '5');
  });

  it('does not shrink below two characters', () => {
    // A single digit would otherwise leave the field narrower than the steppers beside it.
    renderWithValue('');
    expect(screen.getByRole('spinbutton')).toHaveAttribute('size', '2');
  });

  it('lets a caller pin the size', () => {
    render(
      <NumericInput
        aria-label='Delay'
        onChange={() => undefined}
        size={8}
        value='20000'
      />,
    );
    expect(screen.getByRole('spinbutton')).toHaveAttribute('size', '8');
  });
});
