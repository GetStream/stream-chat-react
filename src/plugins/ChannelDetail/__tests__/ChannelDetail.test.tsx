import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import type { Channel } from 'stream-chat';

import { ChannelDetail } from '../ChannelDetail';
import type { SectionNavigatorSection } from '../SectionNavigator';

const sections: SectionNavigatorSection[] = [
  {
    id: 'channel-info',
    NavButton: () => <button type='button'>Channel info nav</button>,
    SectionContent: () => <div>Channel info</div>,
  },
];

const channel = {
  cid: 'messaging:test-channel',
} as Channel;

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
});
