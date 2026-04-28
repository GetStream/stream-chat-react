import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { ProgressBar } from '../components/ProgressBar';

describe('ProgressBar', () => {
  it('adds slider semantics', () => {
    render(<ProgressBar progress={40} seek={vi.fn()} />);

    const root = screen.getByTestId('audio-progress');
    expect(root).toHaveAttribute('role', 'slider');
    expect(root).toHaveAttribute('aria-label', 'aria/Seek audio position');
    expect(root).toHaveAttribute('tabindex', '0');
    expect(root).toHaveAttribute('aria-valuemin', '0');
    expect(root).toHaveAttribute('aria-valuemax', '100');
    expect(root).toHaveAttribute('aria-valuenow', '40');
    expect(root).toHaveAttribute(
      'aria-valuetext',
      'aria/Audio position {{ progress }} percent',
    );
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

  it('seeks forward with PageUp key using larger step', () => {
    const seek = vi.fn();
    render(<ProgressBar progress={40} seek={seek} />);

    const root = screen.getByTestId('audio-progress');
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(
      fromPartial<DOMRect>({
        width: 200,
        x: 10,
      }),
    );

    fireEvent.keyDown(root, { key: 'PageUp' });

    expect(seek).toHaveBeenCalledWith({
      clientX: 110,
      currentTarget: root,
    });
  });

  it('adds time-based aria-valuetext when duration data is available', () => {
    render(
      <ProgressBar
        durationSeconds={200}
        progress={40}
        secondsElapsed={80}
        seek={vi.fn()}
      />,
    );

    const root = screen.getByTestId('audio-progress');
    expect(root).toHaveAttribute(
      'aria-valuetext',
      'aria/Audio position {{ elapsed }} of {{ duration }}',
    );
  });
});
