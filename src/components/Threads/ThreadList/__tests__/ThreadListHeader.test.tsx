import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { WorkspaceNavigationProvider } from '../../../../context';
import { TranslationProvider } from '../../../../context/TranslationContext';
import { mockTranslationContextValue } from '../../../../mock-builders';
import type { ThreadListHeaderProps } from '../ThreadListHeader';
import { ThreadListHeader } from '../ThreadListHeader';
import { mockT } from '../../../../mock-builders/translator';

const t = vi.fn(mockT);
const EndContent = () => <div data-testid='header-end' />;
const StartContent = () => <div data-testid='header-start' />;

afterEach(cleanup);

// Nothing is open in the workspace navigation: the start and end content must not depend on it.
const renderHeader = (props: ThreadListHeaderProps = {}) =>
  render(
    <WorkspaceNavigationProvider
      value={fromPartial({ openChannels: [], openThreads: [] })}
    >
      <TranslationProvider value={mockTranslationContextValue({ t })}>
        <ThreadListHeader {...props} />
      </TranslationProvider>
    </WorkspaceNavigationProvider>,
  );

describe('ThreadListHeader', () => {
  it('should render only the title by default', () => {
    const { container } = renderHeader();

    expect(screen.queryByTestId('header-start')).not.toBeInTheDocument();
    expect(screen.queryByTestId('header-end')).not.toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__thread-list__header')?.children,
    ).toHaveLength(1);
  });

  it('should render StartContent before the title and EndContent after it, without an open thread', () => {
    const { container } = renderHeader({ EndContent, StartContent });

    const children = Array.from(
      container.querySelector('.str-chat__thread-list__header')?.children ?? [],
    );
    expect(
      children.map((child) => child.getAttribute('data-testid') ?? child.className),
    ).toEqual(['header-start', 'str-chat__thread-list__header__title', 'header-end']);
  });
});
