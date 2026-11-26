import React, { createRef, useEffect, useState } from 'react';
import { StateStore } from '@stream-io/state-store';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChatView, useChatViewContext } from '../ChatView';
import { createChatViewSlotBinding } from '../slotBinding';
import { ChannelSlot } from '../ChannelSlot';
import { Slot } from '../layout/Slot';
import { ChatProvider } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import { mockT } from '../../../mock-builders/translator';

import type { ReactNode } from 'react';
import type { Channel as StreamChannel } from 'stream-chat';
import type { ChatContextValue } from '../../../context/ChatContext';
import type { TranslationContextValue } from '../../../context/TranslationContext';
import type { LayoutController } from '../layoutController/layoutControllerTypes';

// Stands in for `<Channel>`, counting the mounts of each channel it renders.
const channelMounts = vi.fn();
vi.mock('../../../components/Channel', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../components/Channel')>();
  const MockChannel = ({
    channel,
    children,
  }: {
    channel: StreamChannel;
    children?: ReactNode;
  }) => {
    useEffect(() => {
      channelMounts(channel.cid);
    }, [channel]);
    return <div data-testid={`channel-${channel.cid}`}>{children}</div>;
  };
  return { ...actual, Channel: MockChannel };
});

const layouts = [{ id: 'channels' as const, slots: ['main', 'secondary'] }];

const chatContextValue = {
  client: { threads: { state: new StateStore({ unreadThreadCount: 0 }) } },
  getAppSettings: vi.fn(() => null),
  openMobileNav: vi.fn(),
  searchController: {},
  theme: 'str-chat__theme-light',
  useImageFlagEmojisOnWindows: false,
} as unknown as ChatContextValue;

const channelBinding = (cid: string) =>
  createChatViewSlotBinding({
    key: cid,
    kind: 'channel',
    source: { cid } as unknown as StreamChannel,
  });

const profileBinding = (userId: string) =>
  createChatViewSlotBinding({ key: userId, kind: 'userProfile', source: { userId } });

// Counts its mounts and holds local state, standing in for a scrolled message list.
const mounts = vi.fn();
const StatefulBase = () => {
  const [clicks, setClicks] = useState(0);
  useEffect(() => {
    mounts();
  }, []);
  return (
    <button
      data-testid='base'
      onClick={() => setClicks((count) => count + 1)}
      type='button'
    >
      {clicks}
    </button>
  );
};

const renderSlot = (slotElement: ReactNode = <Slot slot='secondary' />) => {
  let controller: LayoutController | undefined;
  const CaptureController = () => {
    controller = useChatViewContext().layoutController;
    return null;
  };

  render(
    <ChatProvider value={chatContextValue}>
      <TranslationProvider
        value={{ t: mockT, userLanguage: 'en' } as TranslationContextValue}
      >
        <ChatView layouts={layouts} slotRenderers={{ channel: () => <StatefulBase /> }}>
          <CaptureController />
          {slotElement}
        </ChatView>
      </TranslationProvider>
    </ChatProvider>,
  );

  if (!controller) throw new Error('layout controller not captured');
  return controller;
};

describe('Slot', () => {
  beforeEach(() => {
    channelMounts.mockClear();
    mounts.mockClear();
  });

  it('keeps its base mounted while the first layer opens and the last one closes', () => {
    const controller = renderSlot();
    act(() => controller.bind('secondary', channelBinding('messaging:base')));

    fireEvent.click(screen.getByTestId('base'));
    fireEvent.click(screen.getByTestId('base'));
    expect(mounts).toHaveBeenCalledTimes(1);

    act(() => controller.pushLayer('secondary', profileBinding('first')));
    act(() => controller.pushLayer('secondary', profileBinding('second')));
    act(() => controller.popLayer('secondary'));
    act(() => controller.popLayer('secondary'));

    expect(mounts).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('base')).toHaveTextContent('2');
  });

  it('shows only the topmost of its base and layers', () => {
    const controller = renderSlot();
    act(() => controller.bind('secondary', channelBinding('messaging:base')));
    const baseEntry = screen.getByTestId('base').parentElement;
    act(() => controller.pushLayer('secondary', profileBinding('first')));
    act(() => controller.pushLayer('secondary', profileBinding('second')));

    const entryOf = (userId: string) =>
      document.querySelector(`[data-user-id="${userId}"]`)?.parentElement;

    expect(baseEntry).not.toBeVisible();
    expect(baseEntry).toHaveAttribute('aria-hidden', 'true');
    expect(entryOf('first')).not.toBeVisible();
    expect(entryOf('first')).toHaveAttribute('aria-hidden', 'true');
    expect(entryOf('second')).toBeVisible();
    expect(entryOf('second')).not.toHaveAttribute('aria-hidden');

    act(() => controller.popLayer('secondary'));
    act(() => controller.popLayer('secondary'));

    expect(baseEntry).toBeVisible();
    expect(baseEntry).not.toHaveAttribute('aria-hidden');
  });

  // App styles often set `display` on a panel's root, from a later cascade layer than the SDK's.
  it('keeps a covered entry hidden whatever display app styles give it', () => {
    const style = document.createElement('style');
    style.textContent = `
      .str-chat__chat-view__slot-layer { display: block; }
      [data-testid="base"] { display: flex; }
    `;
    document.head.appendChild(style);
    try {
      const controller = renderSlot();
      act(() => controller.bind('secondary', channelBinding('messaging:base')));
      act(() => controller.pushLayer('secondary', profileBinding('first')));

      const baseEntry = screen.getByTestId('base').parentElement;
      expect(baseEntry).toHaveStyle({ display: 'none' });
      expect(screen.getByTestId('base')).not.toBeVisible();
      expect(document.querySelector('[data-user-id="first"]')?.parentElement).toHaveStyle(
        {
          display: 'contents',
        },
      );
    } finally {
      style.remove();
    }
  });

  // Integrator styles select slots by `:empty`.
  it('stays empty while nothing is bound and lays its base out as its own child', () => {
    const controller = renderSlot();
    const section = document.querySelector('[data-slot="secondary"]');
    expect(section).toBeEmptyDOMElement();

    act(() => controller.bind('secondary', channelBinding('messaging:base')));
    const baseEntry = section?.firstElementChild;
    expect(baseEntry).toContainElement(screen.getByTestId('base'));
    expect(baseEntry).toHaveStyle({ display: 'contents' });

    act(() => controller.release('secondary'));
    expect(section).toBeEmptyDOMElement();
  });

  it('keeps a layer whose binding key is `base` apart from the base', () => {
    const controller = renderSlot();
    act(() => controller.bind('secondary', channelBinding('messaging:base')));
    act(() => controller.pushLayer('secondary', profileBinding('base')));

    expect(screen.getByTestId('base')).toBeInTheDocument();
    expect(document.querySelector('[data-user-id="base"]')).toBeInTheDocument();
  });

  it('puts `className`, `style` and the ref on its section', () => {
    const ref = createRef<HTMLElement>();
    renderSlot(
      <Slot
        className='app-panel'
        ref={ref}
        slot='secondary'
        style={{ width: '320px' }}
      />,
    );

    const section = document.querySelector('[data-slot="secondary"]');
    expect(section).toHaveClass('str-chat__chat-view__slot', 'app-panel');
    expect(section).toHaveStyle({ width: '320px' });
    expect(ref.current).toBe(section);
  });

  // `ChannelSlot` and `ThreadSlot` show only the slot's base; the `Slot` around them adds layers.
  it('stacks layers over a `ChannelSlot` it wraps and keeps the channel mounted beneath', () => {
    const controller = renderSlot(
      <Slot slot='secondary'>
        <ChannelSlot slot='secondary'>
          <StatefulBase />
        </ChannelSlot>
      </Slot>,
    );
    act(() => controller.bind('secondary', channelBinding('messaging:base')));
    fireEvent.click(screen.getByTestId('base'));

    act(() => controller.pushLayer('secondary', profileBinding('first')));

    expect(screen.getByTestId('channel-messaging:base')).not.toBeVisible();
    expect(document.querySelector('[data-user-id="first"]')).toBeVisible();

    act(() => controller.popLayer('secondary'));

    expect(screen.getByTestId('channel-messaging:base')).toBeVisible();
    expect(screen.getByTestId('base')).toHaveTextContent('1');
    expect(channelMounts).toHaveBeenCalledTimes(1);
  });
});
