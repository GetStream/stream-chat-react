import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StreamChat } from 'stream-chat';

import { Chat } from '../../Chat';
import type { ChatProps } from '../../Chat';
import { ChannelNavigation } from '../ChannelNavigation';
import { ThemeScopeProvider } from '../../../context/ThemeScopeContext';
import { getTestClientWithUser } from '../../../mock-builders';
import { axe } from '../../../../axe-helper';

const setupClient = async () => {
  const client = await getTestClientWithUser({ id: 'user_x' });
  // no paginator is registered, so nothing should query
  vi.spyOn(client, 'queryChannelsAndHydrate').mockRejectedValue(
    new Error('unexpected channel query'),
  );
  return client;
};

const renderNavigation = (
  client: StreamChat,
  chatProps: Partial<Omit<ChatProps, 'client'>> = {},
) =>
  render(
    <Chat client={client} {...chatProps}>
      <ChannelNavigation />
    </Chat>,
  );

describe('ChannelNavigation', () => {
  afterEach(cleanup);

  it('carries the str-chat theme scope on its root outside ChatView', async () => {
    const client = await setupClient();

    const { container } = renderNavigation(client, { theme: 'str-chat__theme-dark' });

    const root = container.firstElementChild;
    expect(root).toHaveClass(
      'str-chat',
      'str-chat__theme-dark',
      'str-chat__channel-list',
    );
  });

  it('applies customClasses.chat and customClasses.channelList to its root', async () => {
    const client = await setupClient();

    const { container } = renderNavigation(client, {
      customClasses: { channelList: 'custom-channel-list', chat: 'custom-chat' },
    });

    const root = container.firstElementChild;
    expect(root).toHaveClass('custom-chat', 'custom-channel-list');
    expect(root).not.toHaveClass('str-chat');
    expect(root).not.toHaveClass('str-chat__channel-list');
  });

  it('inherits an enclosing theme scope (e.g. ChatView) instead of nesting one', async () => {
    // `.str-chat` declares the whole token set: a nested one would reset tokens an app overrides
    // on the ChatView root, and pick up app CSS written for `.str-chat` roots.
    const client = await setupClient();

    const { container } = render(
      <Chat client={client} customClasses={{ channelList: 'custom-channel-list' }}>
        <ThemeScopeProvider>
          <ChannelNavigation />
        </ThemeScopeProvider>
      </Chat>,
    );

    const root = container.firstElementChild;
    expect(root).toHaveClass('custom-channel-list');
    expect(root).not.toHaveClass('str-chat');
    expect(container.querySelector('.str-chat')).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const client = await setupClient();

    const { container } = renderNavigation(client);

    expect(await axe(container)).toHaveNoViolations();
  });
});
