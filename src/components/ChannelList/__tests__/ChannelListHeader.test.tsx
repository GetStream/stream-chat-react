import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { ChatProvider, WithComponents } from '../../../context';
import { TranslationProvider } from '../../../context/TranslationContext';
import { mockChatContext, mockTranslationContextValue } from '../../../mock-builders';
import { ChannelListHeader } from '../ChannelListHeader';

const t = vi.fn((key: string) => key);
const HeaderEndContent = () => <div data-testid='sidebar-toggle' />;

afterEach(cleanup);

describe('ChannelListHeader', () => {
  it('should not render HeaderEndContent when not provided via ComponentContext', () => {
    render(
      <ChatProvider value={mockChatContext()}>
        <TranslationProvider value={mockTranslationContextValue({ t })}>
          <ChannelListHeader />
        </TranslationProvider>
      </ChatProvider>,
    );

    expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
  });

  it('should render HeaderEndContent when a channel is active', () => {
    render(
      <WithComponents overrides={{ HeaderEndContent }}>
        <ChatProvider value={mockChatContext({ channel: {} })}>
          <TranslationProvider value={mockTranslationContextValue({ t })}>
            <ChannelListHeader />
          </TranslationProvider>
        </ChatProvider>
      </WithComponents>,
    );

    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
  });

  it('should not render HeaderEndContent when no channel is active', () => {
    render(
      <WithComponents overrides={{ HeaderEndContent }}>
        <ChatProvider value={mockChatContext({ channel: undefined })}>
          <TranslationProvider value={mockTranslationContextValue({ t })}>
            <ChannelListHeader />
          </TranslationProvider>
        </ChatProvider>
      </WithComponents>,
    );

    expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
  });
});
