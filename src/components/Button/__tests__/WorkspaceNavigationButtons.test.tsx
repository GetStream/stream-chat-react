import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel, Thread } from 'stream-chat';

import {
  ChannelInstanceProvider,
  defaultWorkspaceNavigation,
  WorkspaceNavigationProvider,
  WorkspacePanelProvider,
} from '../../../context';
import type { WorkspaceNavigation } from '../../../context';
import { TranslationProvider } from '../../../context/TranslationContext';
import type { TranslationContextValue } from '../../../context/TranslationContext';
import { ThreadProvider } from '../../Threads/ThreadContext';
import { mockT } from '../../../mock-builders/translator';
import {
  WorkspaceNavigationBackButton,
  WorkspaceNavigationCloseButton,
} from '../WorkspaceNavigationButtons';

const channel = fromPartial<Channel>({ cid: 'messaging:header-content' });
const thread = fromPartial<Thread>({ channel, deactivate: vi.fn(), id: 'header-thread' });

const renderButtons = ({
  inChannel = false,
  inThread = false,
  navigation = {},
}: {
  inChannel?: boolean;
  inThread?: boolean;
  navigation?: Partial<WorkspaceNavigation>;
}) => {
  const buttons = (
    <>
      <WorkspaceNavigationBackButton />
      <WorkspaceNavigationCloseButton />
    </>
  );
  const inContext = inThread ? (
    <ThreadProvider thread={thread}>{buttons}</ThreadProvider>
  ) : (
    buttons
  );

  return render(
    <TranslationProvider
      value={fromPartial<TranslationContextValue>({
        t: mockT as TranslationContextValue['t'],
      })}
    >
      <WorkspaceNavigationProvider
        value={{ ...defaultWorkspaceNavigation, ...navigation }}
      >
        {inChannel ? (
          <ChannelInstanceProvider value={{ channel }}>
            {inContext}
          </ChannelInstanceProvider>
        ) : (
          inContext
        )}
      </WorkspaceNavigationProvider>
    </TranslationProvider>,
  );
};

// Every panel can go back and be closed, so what the buttons render depends only on where they are.
const everythingAllowed: Partial<WorkspaceNavigation> = {
  canGoBack: () => true,
  isChannelDismissable: () => true,
  isThreadDismissable: () => true,
};

describe('WorkspaceNavigationBackButton and WorkspaceNavigationCloseButton', () => {
  afterEach(cleanup);

  // The list headers share the slots and have no channel or thread in context.
  it('render nothing outside a channel or thread', () => {
    renderButtons({ navigation: everythingAllowed });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('act on the channel in context', () => {
    const closeChannel = vi.fn();
    const goBack = vi.fn();
    renderButtons({
      inChannel: true,
      navigation: { ...everythingAllowed, closeChannel, goBack },
    });

    fireEvent.click(screen.getByTestId('channel-header-back-button'));
    fireEvent.click(screen.getByTestId('close-channel-button'));

    expect(goBack).toHaveBeenCalledWith(channel.cid, expect.anything());
    expect(closeChannel).toHaveBeenCalledWith(channel.cid, expect.anything());
  });

  it('act on the thread when a channel is in context too', () => {
    const closeThread = vi.fn();
    const goBack = vi.fn();
    renderButtons({
      inChannel: true,
      inThread: true,
      navigation: { ...everythingAllowed, closeThread, goBack },
    });

    fireEvent.click(screen.getByTestId('thread-header-back-button'));
    fireEvent.click(screen.getByTestId('close-thread-button'));

    expect(goBack).toHaveBeenCalledWith(thread.id, expect.anything());
    expect(closeThread).toHaveBeenCalledWith(thread.id, expect.anything());
    expect(screen.queryByTestId('close-channel-button')).not.toBeInTheDocument();
  });

  // The same channel or thread can be open in two panels; the panel the buttons render in says
  // which one they act on.
  it('pass the panel they render in to the workspace navigation', () => {
    const canGoBack = vi.fn(() => true);
    const closeChannel = vi.fn();
    const goBack = vi.fn();
    const isChannelDismissable = vi.fn(() => true);
    render(
      <TranslationProvider
        value={fromPartial<TranslationContextValue>({
          t: mockT as TranslationContextValue['t'],
        })}
      >
        <WorkspaceNavigationProvider
          value={{
            ...defaultWorkspaceNavigation,
            canGoBack,
            closeChannel,
            goBack,
            isChannelDismissable,
          }}
        >
          <ChannelInstanceProvider value={{ channel }}>
            <WorkspacePanelProvider panel='beside'>
              <WorkspaceNavigationBackButton />
              <WorkspaceNavigationCloseButton />
            </WorkspacePanelProvider>
          </ChannelInstanceProvider>
        </WorkspaceNavigationProvider>
      </TranslationProvider>,
    );

    expect(canGoBack).toHaveBeenCalledWith(channel.cid, 'beside');
    expect(isChannelDismissable).toHaveBeenCalledWith(channel.cid, 'beside');

    fireEvent.click(screen.getByTestId('channel-header-back-button'));
    fireEvent.click(screen.getByTestId('close-channel-button'));

    expect(goBack).toHaveBeenCalledWith(
      channel.cid,
      expect.objectContaining({ panel: 'beside' }),
    );
    expect(closeChannel).toHaveBeenCalledWith(
      channel.cid,
      expect.objectContaining({ panel: 'beside' }),
    );
  });

  it('render nothing for a panel that cannot go back or be closed', () => {
    renderButtons({ inChannel: true });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
