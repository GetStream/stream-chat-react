import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { NumericInput } from '../NumericInput';

const renderWithValue = (value: string) =>
  render(<NumericInput aria-label='Delay' onChange={() => undefined} value={value} />);

describe('NumericInput', () => {
  // Sizing is CSS, which jsdom does not lay out, so this pins the mechanism: the `size` attribute
  // tracks the value, which keeps long values from being cut off.
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

  it.each([
    ['increment', 'Increase value'],
    ['decrement', 'Decrease value'],
  ])('steps an empty value without a lower bound to 0 on %s', (_, buttonName) => {
    const onChange = vi.fn();
    render(<NumericInput aria-label='Delay' onChange={onChange} value='' />);

    fireEvent.click(screen.getByRole('button', { name: buttonName }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: { value: '0' } }),
    );
  });

  it('steps an empty value to the lower bound', () => {
    const onChange = vi.fn();
    render(
      <NumericInput aria-label='Votes' max={10} min={2} onChange={onChange} value='' />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Increase value' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: { value: '2' } }),
    );
  });
});
