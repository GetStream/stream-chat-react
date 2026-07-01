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
  manualLoadMore = false,
  withLoadMore = false,
}: {
  initialCount?: number;
  loadMoreAddsCount?: number;
  // When true, the Load more button only arms the hook (no rows appended); page loading and an
  // unrelated "WebSocket" prepend are driven by separate controls so a mid-window insert can be
  // injected before the next page renders. Ids are stable so React keeps each row's DOM node.
  manualLoadMore?: boolean;
  withLoadMore?: boolean;
}) => {
  const [ids, setIds] = useState(() => Array.from({ length: initialCount }, (_, i) => i));
  const nextIdRef = useRef(initialCount);
  const prevIdRef = useRef(-1);
  const listboxRef = useRef<HTMLDivElement>(null);
  const { onClickCapture, onKeyDown } = useChannelListKeyboardNavigation(listboxRef);

  const appendPage = () =>
    setIds((current) => [
      ...current,
      ...Array.from({ length: loadMoreAddsCount }, () => nextIdRef.current++),
    ]);
  const prependUnrelated = () => setIds((current) => [prevIdRef.current--, ...current]);
  const removeLast = () => setIds((current) => current.slice(0, -1));

  return (
    <div
      aria-label='Channel list'
      onClickCapture={onClickCapture}
      onKeyDown={onKeyDown}
      ref={listboxRef}
      role='listbox'
    >
      {ids.map((id) => (
        <Row id={id} key={id} />
      ))}
      {withLoadMore && (
        <button
          data-testid='load-more-button'
          onClick={manualLoadMore ? undefined : appendPage}
          type='button'
        >
          Load more
        </button>
      )}
      {manualLoadMore && (
        <>
          <button data-testid='append-page' onClick={appendPage} type='button'>
            Append page
          </button>
          <button data-testid='ws-prepend' onClick={prependUnrelated} type='button'>
            WS insert
          </button>
          <button data-testid='remove-last' onClick={removeLast} type='button'>
            Remove last
          </button>
        </>
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

  it('does not focus an unrelated row that arrives before the next page, then focuses the real first new row', async () => {
    render(<Harness manualLoadMore withLoadMore />);

    // Arm the focus move (Load more pressed) but the page has not loaded yet.
    fireEvent.click(screen.getByTestId('load-more-button'));

    // A channel arrives over the WebSocket and sorts to the top during the load window: the list
    // grows, but this row is not the next page and must NOT receive focus.
    fireEvent.click(screen.getByTestId('ws-prepend'));
    await Promise.resolve();
    expect(screen.getByTestId('option--1')).not.toHaveFocus();
    expect(document.body).toHaveFocus();

    // The real next page renders (appended after the pre-load boundary) → its first row is focused.
    fireEvent.click(screen.getByTestId('append-page'));
    await waitFor(() => {
      expect(screen.getByTestId('option-3')).toHaveFocus();
    });
  });

  it('drops the pending focus move when the pre-load boundary row is removed', async () => {
    render(<Harness manualLoadMore withLoadMore />);

    fireEvent.click(screen.getByTestId('load-more-button'));
    // The boundary row (last pre-load option) is removed before the page arrives.
    fireEvent.click(screen.getByTestId('remove-last'));
    // The page then loads; with the boundary gone the request is dropped rather than guessing.
    fireEvent.click(screen.getByTestId('append-page'));

    await waitFor(() => {
      expect(screen.getByTestId('option-3')).toBeInTheDocument();
    });
    expect(screen.getByTestId('option-3')).not.toHaveFocus();
    expect(document.body).toHaveFocus();
  });
});
