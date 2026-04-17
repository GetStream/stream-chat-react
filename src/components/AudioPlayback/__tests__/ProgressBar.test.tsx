import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { ProgressBar } from '../components/ProgressBar';

describe('ProgressBar', () => {
  it('adds keyboard focus semantics', () => {
    render(<ProgressBar progress={40} seek={vi.fn()} />);

    const root = screen.getByTestId('audio-progress');
    expect(root).toHaveAttribute('tabindex', '0');
    expect(root).toHaveAttribute('aria-valuemin', '0');
    expect(root).toHaveAttribute('aria-valuemax', '100');
    expect(root).toHaveAttribute('aria-valuenow', '40');
  });

  it('seeks forward with ArrowRight key', () => {
    const seek = vi.fn();
    render(<ProgressBar progress={40} seek={seek} />);

    const root = screen.getByTestId('audio-progress');
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(
      fromPartial<DOMRect>({
        width: 200,
        x: 10,
      }),
    );

    fireEvent.keyDown(root, { key: 'ArrowRight' });

    expect(seek).toHaveBeenCalledWith({
      clientX: 100,
      currentTarget: root,
    });
  });
});
