import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import type { Channel } from 'stream-chat';

import { ChannelDetail } from '../ChannelDetail';
import { ChannelDetailProvider, useChannelDetailContext } from '../ChannelDetailContext';
import {
  SECTION_NAVIGATOR_LAYOUT,
  SectionNavigatorHeader,
  type SectionNavigatorSection,
} from '../SectionNavigator';
import { ModalContextProvider, useModalContext } from '../../../context';

const sections: SectionNavigatorSection[] = [
  {
    id: 'channel-info',
    NavButton: () => <button type='button'>Channel info nav</button>,
    SectionContent: () => <div>Channel info</div>,
  },
];

// Wires its header the way the default views do.
const CloseableSectionContent = () => {
  const { close } = useChannelDetailContext();

  return <SectionNavigatorHeader close={close} title='Channel info' />;
};

const closeableSections: SectionNavigatorSection[] = [
  {
    id: 'channel-info',
    NavButton: () => <button type='button'>Channel info nav</button>,
    SectionContent: CloseableSectionContent,
  },
];

const channel = {
  cid: 'messaging:test-channel',
} as Channel;

const queryCloseButton = () => screen.queryByRole('button', { name: 'Close' });

describe('ChannelDetail', () => {
  const OriginalResizeObserver = globalThis.ResizeObserver;

  beforeEach(() => {
    globalThis.ResizeObserver = class MockResizeObserver implements ResizeObserver {
      disconnect = vi.fn();
      observe = vi.fn();
      unobserve = vi.fn();
    };
  });

  afterEach(() => {
    globalThis.ResizeObserver = OriginalResizeObserver;
  });

  it('applies the channel-detail width class to the prompt wrapper', () => {
    const { container } = render(
      <ChannelDetail
        channel={channel}
        className='custom-channel-detail'
        sections={sections}
      />,
    );

    const prompt = container.querySelector('.str-chat__prompt');
    const sectionNavigator = container.querySelector('.str-chat__section-navigator');

    expect(prompt).toHaveClass('str-chat__channel-detail');
    expect(prompt).toHaveClass('custom-channel-detail');
    expect(sectionNavigator).not.toHaveClass('str-chat__channel-detail');
    expect(screen.getByText('Channel info')).toBeInTheDocument();
  });

  describe('onLayoutChange', () => {
    it('calls the caller with every layout and still applies the inline class', () => {
      const onLayoutChange = vi.fn();
      const { container, rerender } = render(
        <ChannelDetail
          channel={channel}
          layout={SECTION_NAVIGATOR_LAYOUT.tabs}
          onLayoutChange={onLayoutChange}
          sections={sections}
        />,
      );

      expect(onLayoutChange).toHaveBeenLastCalledWith(SECTION_NAVIGATOR_LAYOUT.tabs);

      rerender(
        <ChannelDetail
          channel={channel}
          layout={SECTION_NAVIGATOR_LAYOUT.inline}
          onLayoutChange={onLayoutChange}
          sections={sections}
        />,
      );

      expect(onLayoutChange).toHaveBeenLastCalledWith(SECTION_NAVIGATOR_LAYOUT.inline);
      expect(container.querySelector('.str-chat__prompt')).toHaveClass(
        'str-chat__channel-detail--inline',
      );
    });

    it('reports a layout once when the caller passes a new onLayoutChange on every render', () => {
      const onLayoutChange = vi.fn();
      const renderChannelDetail = () => (
        <ChannelDetail
          channel={channel}
          layout={SECTION_NAVIGATOR_LAYOUT.tabs}
          onLayoutChange={(layout) => onLayoutChange(layout)}
          sections={sections}
        />
      );
      const { rerender } = render(renderChannelDetail());

      rerender(renderChannelDetail());
      rerender(renderChannelDetail());

      expect(onLayoutChange).toHaveBeenCalledTimes(1);
      expect(onLayoutChange).toHaveBeenCalledWith(SECTION_NAVIGATOR_LAYOUT.tabs);
    });
  });

  describe('close button', () => {
    it('is hidden outside a modal when no onClose is given', () => {
      render(<ChannelDetail channel={channel} sections={closeableSections} />);

      expect(screen.getByRole('heading', { name: 'Channel info' })).toBeInTheDocument();
      expect(queryCloseButton()).not.toBeInTheDocument();
    });

    it('calls onClose outside a modal', () => {
      const onClose = vi.fn();
      render(
        <ChannelDetail
          channel={channel}
          onClose={onClose}
          sections={closeableSections}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls the modal close inside a modal', () => {
      const close = vi.fn();
      render(
        <ModalContextProvider value={{ close }}>
          <ChannelDetail channel={channel} sections={closeableSections} />
        </ModalContextProvider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(close).toHaveBeenCalledTimes(1);
    });

    it('calls onClose instead of the modal close inside a modal', () => {
      const close = vi.fn();
      const onClose = vi.fn();
      render(
        <ModalContextProvider value={{ close }}>
          <ChannelDetail
            channel={channel}
            onClose={onClose}
            sections={closeableSections}
          />
        </ModalContextProvider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(close).not.toHaveBeenCalled();
    });

    it('calls the close of a modal opened inside the channel detail instead of onClose', () => {
      const nestedModalClose = vi.fn();
      const onClose = vi.fn();
      const nestedModalSections: SectionNavigatorSection[] = [
        {
          ...closeableSections[0],
          SectionContent: () => (
            <ModalContextProvider value={{ close: nestedModalClose }}>
              <CloseableSectionContent />
            </ModalContextProvider>
          ),
        },
      ];
      render(
        <ChannelDetail
          channel={channel}
          onClose={onClose}
          sections={nestedModalSections}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(nestedModalClose).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("keeps the surrounding modal's dialogId when onClose is given", () => {
      const DialogIdSectionContent = () => <div>{useModalContext().dialogId}</div>;
      render(
        <ModalContextProvider
          value={{ close: vi.fn(), dialogId: 'channel-detail-dialog' }}
        >
          <ChannelDetail
            channel={channel}
            onClose={vi.fn()}
            sections={[{ ...sections[0], SectionContent: DialogIdSectionContent }]}
          />
        </ModalContextProvider>,
      );

      expect(screen.getByText('channel-detail-dialog')).toBeInTheDocument();
    });
  });
});

describe('useChannelDetailContext', () => {
  const CloseButton = () => {
    const { close } = useChannelDetailContext();

    return close ? (
      <button onClick={close} type='button'>
        Close
      </button>
    ) : null;
  };

  it('returns the channel', () => {
    const ChannelCid = () => <div>{useChannelDetailContext().channel.cid}</div>;
    render(
      <ChannelDetailProvider channel={channel}>
        <ChannelCid />
      </ChannelDetailProvider>,
    );

    expect(screen.getByText(channel.cid)).toBeInTheDocument();
  });

  it('throws outside ChannelDetailProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<CloseButton />)).toThrow(
      'The useChannelDetailContext hook was called outside of ChannelDetailProvider.',
    );
    consoleError.mockRestore();
  });

  it("returns the provider's onClose as close", () => {
    const onClose = vi.fn();
    render(
      <ChannelDetailProvider channel={channel} onClose={onClose}>
        <CloseButton />
      </ChannelDetailProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('returns the close of a modal provided inside ChannelDetailProvider', () => {
    const close = vi.fn();
    const onClose = vi.fn();
    render(
      <ChannelDetailProvider channel={channel} onClose={onClose}>
        <ModalContextProvider value={{ close }}>
          <CloseButton />
        </ModalContextProvider>
      </ChannelDetailProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(close).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not re-render its consumers when the provider gets a new onClose function', () => {
    const onClose = vi.fn();
    let renderCount = 0;
    const CountingCloseButton = React.memo(function CountingCloseButton() {
      const { close } = useChannelDetailContext();
      renderCount += 1;

      return (
        <button onClick={close} type='button'>
          Close
        </button>
      );
    });
    const renderProvider = () => (
      <ChannelDetailProvider channel={channel} onClose={() => onClose()}>
        <CountingCloseButton />
      </ChannelDetailProvider>
    );
    const { rerender } = render(renderProvider());

    rerender(renderProvider());
    rerender(renderProvider());
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(renderCount).toBe(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('returns no close outside a modal without onClose', () => {
    render(
      <ChannelDetailProvider channel={channel}>
        <CloseButton />
      </ChannelDetailProvider>,
    );

    expect(queryCloseButton()).not.toBeInTheDocument();
  });
});
