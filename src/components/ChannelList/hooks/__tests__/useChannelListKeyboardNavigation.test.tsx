import React, { useRef, useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { useChannelListKeyboardNavigation } from '../useChannelListKeyboardNavigation';

const Row = ({ id }: { id: number }) => (
  <div className='str-chat__channel-list-item-container'>
    <button data-testid={`option-${id}`} role='option' type='button'>
      Channel {id}
    </button>
    <div className='str-chat__channel-list-item__action-buttons'>
      <button data-testid={`menu-${id}`} type='button'>
        Menu
      </button>
      <button data-testid={`action-${id}`} type='button'>
        Channel actions
      </button>
    </div>
  </div>
);

const Harness = ({
  initialCount = 3,
  loadMoreAddsCount = 2,
  withLoadMore = false,
}: {
  initialCount?: number;
  loadMoreAddsCount?: number;
  withLoadMore?: boolean;
}) => {
  const [count, setCount] = useState(initialCount);
  const listboxRef = useRef<HTMLDivElement>(null);
  const { onClickCapture, onKeyDown } = useChannelListKeyboardNavigation(listboxRef);
  return (
    <div
      aria-label='Channel list'
      onClickCapture={onClickCapture}
      onKeyDown={onKeyDown}
      ref={listboxRef}
      role='listbox'
    >
      {Array.from({ length: count }, (_, index) => (
        <Row id={index} key={index} />
      ))}
      {withLoadMore && (
        <button
          data-testid='load-more-button'
          onClick={() => setCount((current) => current + loadMoreAddsCount)}
          type='button'
        >
          Load more
        </button>
      )}
    </div>
  );
};

describe('useChannelListKeyboardNavigation', () => {
  it('moves focus between rows with ArrowDown/ArrowUp', () => {
    render(<Harness />);
    screen.getByTestId('option-0').focus();

    fireEvent.keyDown(screen.getByTestId('option-0'), { key: 'ArrowDown' });
    expect(screen.getByTestId('option-1')).toHaveFocus();

    fireEvent.keyDown(screen.getByTestId('option-1'), { key: 'ArrowDown' });
    expect(screen.getByTestId('option-2')).toHaveFocus();

    fireEvent.keyDown(screen.getByTestId('option-2'), { key: 'ArrowUp' });
    expect(screen.getByTestId('option-1')).toHaveFocus();
  });

  it('jumps to first/last row with Home/End', () => {
    render(<Harness />);
    screen.getByTestId('option-1').focus();

    fireEvent.keyDown(screen.getByTestId('option-1'), { key: 'End' });
    expect(screen.getByTestId('option-2')).toHaveFocus();

    fireEvent.keyDown(screen.getByTestId('option-2'), { key: 'Home' });
    expect(screen.getByTestId('option-0')).toHaveFocus();
  });

  it('cycles through the row actions with ArrowRight/ArrowLeft, returning to the option at the edges', () => {
    render(<Harness />);
    screen.getByTestId('option-1').focus();

    // Enter the actions from the option and move right through them.
    fireEvent.keyDown(screen.getByTestId('option-1'), { key: 'ArrowRight' });
    expect(screen.getByTestId('menu-1')).toHaveFocus();
    fireEvent.keyDown(screen.getByTestId('menu-1'), { key: 'ArrowRight' });
    expect(screen.getByTestId('action-1')).toHaveFocus();
    // Rightmost action + ArrowRight returns to the option.
    fireEvent.keyDown(screen.getByTestId('action-1'), { key: 'ArrowRight' });
    expect(screen.getByTestId('option-1')).toHaveFocus();

    // Going the other way: ArrowLeft from the option wraps to the last action, then left to the
    // first, then back out to the option.
    fireEvent.keyDown(screen.getByTestId('option-1'), { key: 'ArrowLeft' });
    expect(screen.getByTestId('action-1')).toHaveFocus();
    fireEvent.keyDown(screen.getByTestId('action-1'), { key: 'ArrowLeft' });
    expect(screen.getByTestId('menu-1')).toHaveFocus();
    fireEvent.keyDown(screen.getByTestId('menu-1'), { key: 'ArrowLeft' });
    expect(screen.getByTestId('option-1')).toHaveFocus();
  });

  it('navigates between channels with ArrowDown/ArrowUp/Home/End while focus is on a row action', () => {
    render(<Harness />);

    // From an action button, ArrowDown moves to the next channel (relative to that row).
    screen.getByTestId('menu-1').focus();
    fireEvent.keyDown(screen.getByTestId('menu-1'), { key: 'ArrowDown' });
    expect(screen.getByTestId('option-2')).toHaveFocus();

    // ArrowUp from an action moves to the previous channel.
    screen.getByTestId('action-1').focus();
    fireEvent.keyDown(screen.getByTestId('action-1'), { key: 'ArrowUp' });
    expect(screen.getByTestId('option-0')).toHaveFocus();

    // Home/End jump to the first/last channel from an action too.
    screen.getByTestId('menu-2').focus();
    fireEvent.keyDown(screen.getByTestId('menu-2'), { key: 'Home' });
    expect(screen.getByTestId('option-0')).toHaveFocus();

    screen.getByTestId('menu-0').focus();
    fireEvent.keyDown(screen.getByTestId('menu-0'), { key: 'End' });
    expect(screen.getByTestId('option-2')).toHaveFocus();
  });

  it('arrows from the last row to the Load more button and back', () => {
    render(<Harness withLoadMore />);
    screen.getByTestId('option-2').focus();

    fireEvent.keyDown(screen.getByTestId('option-2'), { key: 'ArrowDown' });
    expect(screen.getByTestId('load-more-button')).toHaveFocus();

    fireEvent.keyDown(screen.getByTestId('load-more-button'), { key: 'ArrowUp' });
    expect(screen.getByTestId('option-2')).toHaveFocus();
  });

  it('End reaches the Load more button as the last navigable item', () => {
    render(<Harness withLoadMore />);
    screen.getByTestId('option-0').focus();

    fireEvent.keyDown(screen.getByTestId('option-0'), { key: 'End' });
    expect(screen.getByTestId('load-more-button')).toHaveFocus();
  });

  it('focuses the first item of the next page after Load more', async () => {
    render(<Harness loadMoreAddsCount={2} withLoadMore />);

    // 3 options initially; activating Load more appends 2 → option-3 is the first new item.
    fireEvent.click(screen.getByTestId('load-more-button'));

    await waitFor(() => {
      expect(screen.getByTestId('option-3')).toHaveFocus();
    });
  });
});
