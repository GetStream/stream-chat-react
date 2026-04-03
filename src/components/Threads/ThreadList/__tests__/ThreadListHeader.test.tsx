import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Thread } from 'stream-chat';
import { ChatProvider, WithComponents } from '../../../../context';
import { TranslationProvider } from '../../../../context/TranslationContext';
import { mockChatContext, mockTranslationContextValue } from '../../../../mock-builders';
import { ThreadListHeader } from '../ThreadListHeader';

vi.mock('../../../ChatView', () => ({
  useThreadsViewContext: vi.fn(() => ({ activeThread: undefined })),
}));

import { useThreadsViewContext } from '../../../ChatView';

const t = vi.fn((key: string) => key);
const SidebarToggle = () => <div data-testid='sidebar-toggle' />;

afterEach(cleanup);

describe('ThreadListHeader', () => {
  it('should not render SidebarToggle when not provided via ComponentContext', () => {
    render(
      <ChatProvider value={mockChatContext()}>
        <TranslationProvider value={mockTranslationContextValue({ t })}>
          <ThreadListHeader />
        </TranslationProvider>
      </ChatProvider>,
    );

    expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
  });

  it('should render SidebarToggle when a thread is active', () => {
    vi.mocked(useThreadsViewContext).mockReturnValue({
      activeThread: fromPartial<Thread>({}),
      setActiveThread: vi.fn(),
    });

    render(
      <WithComponents overrides={{ SidebarToggle }}>
        <ChatProvider value={mockChatContext()}>
          <TranslationProvider value={mockTranslationContextValue({ t })}>
            <ThreadListHeader />
          </TranslationProvider>
        </ChatProvider>
      </WithComponents>,
    );

    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
  });

  it('should not render SidebarToggle when no thread is active', () => {
    vi.mocked(useThreadsViewContext).mockReturnValue({
      activeThread: undefined,
      setActiveThread: vi.fn(),
    });

    render(
      <WithComponents overrides={{ SidebarToggle }}>
        <ChatProvider value={mockChatContext()}>
          <TranslationProvider value={mockTranslationContextValue({ t })}>
            <ThreadListHeader />
          </TranslationProvider>
        </ChatProvider>
      </WithComponents>,
    );

    expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
  });
});
