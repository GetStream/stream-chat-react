import React from 'react';
import { render, screen } from '@testing-library/react';
import type { Channel, Mute } from 'stream-chat';

import { ChannelDetailProvider } from '../ChannelDetailContext';
import { ChannelManagementView } from '../Views/ChannelManagementView';

const mocks = vi.hoisted(() => ({
  channel: {
    data: {
      member_count: 2,
      name: 'Test channel',
    },
    state: {
      members: {
        'other-user': { user: { id: 'other-user' } },
        'own-user': { user: { id: 'own-user' } },
      },
      membership: {},
    },
  },
  close: vi.fn(),
  mutes: [] as Mute[],
}));

vi.mock('../../../context', () => ({
  useChatContext: () => ({
    client: {
      user: { id: 'own-user' },
    },
    mutes: mocks.mutes,
  }),
  useComponentContext: () => ({
    Avatar: () => <div data-testid='channel-management-avatar' />,
  }),
  useModalContext: () => ({ close: mocks.close }),
  useTranslationContext: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../context/ChatContext', () => ({
  useChatContext: () => ({
    client: {
      user: { id: 'own-user' },
    },
    mutes: mocks.mutes,
  }),
}));

vi.mock('../../ChannelList', () => ({
  useChannelMembershipState: () => mocks.channel.state.membership,
}));

vi.mock('../../ChannelListItem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ChannelListItem')>();

  return {
    ...actual,
    useChannelPreviewInfo: () => ({
      displayImage: undefined,
      displayTitle: 'Other user',
      groupChannelDisplayInfo: { members: [] },
    }),
  };
});

vi.mock('../../ChannelListItem/hooks/useIsChannelMuted', () => ({
  useIsChannelMuted: () => ({ muted: false }),
}));

vi.mock('../../ChannelHeader/hooks/useChannelHasMembersOnline', () => ({
  useChannelHasMembersOnline: () => false,
}));

vi.mock('../../ChannelHeader/hooks/useChannelHeaderOnlineStatus', () => ({
  useChannelHeaderOnlineStatus: () => undefined,
}));

vi.mock('../../Dialog', () => ({
  Prompt: {
    Body: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>,
    Header: ({ description, title }: { description: string; title: string }) => (
      <header>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
    ),
  },
}));

vi.mock('../../Icons', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../Icons')>();

  return {
    ...actual,
    IconMute: () => <span data-testid='channel-management-muted-icon' />,
    IconPin: () => <span data-testid='channel-management-pinned-icon' />,
  };
});

const renderChannelManagementView = () =>
  render(
    <ChannelDetailProvider channel={mocks.channel as unknown as Channel}>
      <ChannelManagementView channelManagementActionSet={[]} layout='tabs' />
    </ChannelDetailProvider>,
  );

describe('ChannelManagementView', () => {
  beforeEach(() => {
    mocks.mutes = [];
  });

  it('reacts to muted DM user state from ChatContext mutes', () => {
    const { rerender } = renderChannelManagementView();

    expect(screen.queryByTestId('channel-management-muted-icon')).not.toBeInTheDocument();

    mocks.mutes = [
      {
        target: { id: 'other-user' },
      } as Mute,
    ];

    rerender(
      <ChannelDetailProvider channel={mocks.channel as unknown as Channel}>
        <ChannelManagementView channelManagementActionSet={[]} layout='tabs' />
      </ChannelDetailProvider>,
    );

    expect(screen.getByTestId('channel-management-muted-icon')).toBeInTheDocument();
  });
});
