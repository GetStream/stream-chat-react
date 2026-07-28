import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { SkipNavigation } from '../SkipNavigation';

describe('SkipNavigation', () => {
  it('renders one link for each provided id', () => {
    render(<SkipNavigation targetIds={['main-content', 'composer']} />);

    expect(
      screen.getByRole('link', {
        name: 'Skip to main-content',
      }),
    ).toHaveAttribute('href', '#main-content');
    expect(
      screen.getByRole('link', {
        name: 'Skip to composer',
      }),
    ).toHaveAttribute('href', '#composer');
  });

  it('focuses each target element and adds temporary tabindex when missing', () => {
    render(
      <>
        <SkipNavigation targetIds={['main-content', 'composer']} />
        <div id='main-content'>Main content</div>
        <div id='composer'>Composer</div>
      </>,
    );

    const link = screen.getByRole('link', {
      name: 'Skip to composer',
    });
    const target = screen.getByText('Composer');

    fireEvent.click(link);

    expect(target).toHaveFocus();
    expect(target).toHaveAttribute('tabindex', '-1');

    fireEvent.blur(target);

    expect(target).not.toHaveAttribute('tabindex');
  });

  it('prevents the default in-page hash navigation on click (focus stays JS-driven)', () => {
    render(
      <>
        <SkipNavigation targetIds={['main-content']} />
        <div id='main-content'>Main content</div>
      </>,
    );

    const link = screen.getByRole('link', { name: 'Skip to main-content' });
    const target = screen.getByText('Main content');

    // fireEvent returns false when the event's default action was prevented.
    const defaultAllowed = fireEvent.click(link);

    expect(defaultAllowed).toBe(false);
    expect(target).toHaveFocus();
  });

  it('does not override prevented onClick behavior', () => {
    const onClick = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) =>
      event.preventDefault(),
    );

    render(
      <>
        <SkipNavigation onClick={onClick} targetIds={['main-content']} />
        <div id='main-content'>Main content</div>
      </>,
    );

    const link = screen.getByRole('link', {
      name: 'Skip to main-content',
    });
    const target = screen.getByText('Main content');

    fireEvent.click(link);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(target).not.toHaveFocus();
    expect(target).not.toHaveAttribute('tabindex');
  });

  it('normalizes # prefixed ids', () => {
    render(<SkipNavigation targetIds={['#main-content']} />);

    expect(
      screen.getByRole('link', {
        name: 'Skip to main-content',
      }),
    ).toHaveAttribute('href', '#main-content');
  });

  it('activates target on Enter and Space key presses', () => {
    render(
      <>
        <SkipNavigation targetIds={['main-content']} />
        <div id='main-content'>Main content</div>
      </>,
    );

    const link = screen.getByRole('link', {
      name: 'Skip to main-content',
    });
    const target = screen.getByText('Main content');

    fireEvent.keyDown(link, { key: 'Enter' });

    expect(target).toHaveFocus();

    fireEvent.blur(target);
    fireEvent.keyDown(link, { key: ' ' });

    expect(target).toHaveFocus();
  });

  it('removes temporary tabindex on unmount', () => {
    const target = document.createElement('div');
    target.id = 'main-content';
    target.textContent = 'Main content';
    document.body.appendChild(target);

    const { unmount } = render(<SkipNavigation targetIds={['main-content']} />);
    const link = screen.getByRole('link', {
      name: 'Skip to main-content',
    });

    fireEvent.click(link);
    expect(target).toHaveAttribute('tabindex', '-1');

    unmount();
    expect(target).not.toHaveAttribute('tabindex');

    target.remove();
  });
});
