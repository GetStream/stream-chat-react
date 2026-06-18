import { render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import React from 'react';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import {
  useChatContext,
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../../context';
import { ChannelDetailProvider } from '../../../ChannelDetailContext';
import { ChannelMemberDetail } from '../ChannelMemberDetail';

vi.mock('../../../../../context');

vi.mock('../../../../../components/Dialog', () => ({
  Prompt: {
    Body: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Header: ({ title }: { title: string }) => <h2>{title}</h2>,
  },
}));

const createChannel = ({
  members,
  ownCapabilities = ['update-channel-members', 'ban-channel-members'],
}: {
  members?: Channel['state']['members'];
  ownCapabilities?: string[];
} = {}) =>
  fromPartial<Channel>({
    data: {
      own_capabilities: ownCapabilities,
    },
    state: {
      members: members ?? {
        me: {
          user: { id: 'user-me', name: 'Me' },
          user_id: 'user-me',
        },
        'user-2': {
          user: {
            id: 'user-2',
            last_active: '2026-01-01T00:00:00.000000000Z',
            name: 'Bob',
          },
          user_id: 'user-2',
        },
      },
    },
  });

const renderWithChannel = (ui: React.ReactElement, channel: Channel = createChannel()) =>
  render(<ChannelDetailProvider channel={channel}>{ui}</ChannelDetailProvider>);

const createAction = (type: string, label: string) => ({
  Component: () => <span>{label}</span>,
  type,
});

describe('ChannelMemberDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useTranslationContext).mockReturnValue({
      t: (key: string, options?: { timestamp?: string }) =>
        options?.timestamp ? `${key}:${options.timestamp}` : key,
    } as ReturnType<typeof useTranslationContext>);

    vi.mocked(useChatContext).mockReturnValue({
      client: { user: { id: 'user-me' } },
      mutes: [],
    } as ReturnType<typeof useChatContext>);

    vi.mocked(useModalContext).mockReturnValue({
      close: vi.fn(),
    } as ReturnType<typeof useModalContext>);

    vi.mocked(useComponentContext).mockReturnValue(
      {} as ReturnType<typeof useComponentContext>,
    );
  });

  it('uses fallback member from channel state when member prop is not provided', () => {
    renderWithChannel(
      <ChannelMemberDetail channelMemberActionSet={[]} layout='inline' />,
    );

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Member detail')).toBeInTheDocument();
  });

  it('renders empty state when no member is available', () => {
    renderWithChannel(
      <ChannelMemberDetail layout='inline' />,
      createChannel({ members: {} }),
    );

    expect(screen.getByText('Member not found')).toBeInTheDocument();
  });

  it('filters actions by capabilities for another member', () => {
    const actionSet = [
      createAction('sendMessage', 'Send'),
      createAction('muteUser', 'Mute'),
      createAction('blockUser', 'Block'),
      createAction('removeUser', 'Remove'),
    ];

    renderWithChannel(
      <ChannelMemberDetail channelMemberActionSet={actionSet} layout='inline' />,
      createChannel({ ownCapabilities: ['ban-channel-members'] }),
    );

    expect(screen.getByText('Send')).toBeInTheDocument();
    expect(screen.getByText('Mute')).toBeInTheDocument();
    expect(screen.getByText('Block')).toBeInTheDocument();
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });

  it('shows personal actions (block, mute) without channel moderation capabilities', () => {
    const actionSet = [
      createAction('sendMessage', 'Send'),
      createAction('muteUser', 'Mute'),
      createAction('blockUser', 'Block'),
      createAction('removeUser', 'Remove'),
    ];

    renderWithChannel(
      <ChannelMemberDetail channelMemberActionSet={actionSet} layout='inline' />,
      createChannel({ ownCapabilities: [] }),
    );

    // Blocking and muting are per-user actions, not gated on channel capabilities.
    expect(screen.getByText('Block')).toBeInTheDocument();
    expect(screen.getByText('Mute')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
    // Removing a member still requires the update-channel-members capability.
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });

  it('hides member actions when viewing current user details', () => {
    const ownMember = fromPartial<ChannelMemberResponse>({
      user: { id: 'user-me', name: 'Me' },
      user_id: 'user-me',
    });
    const actionSet = [
      createAction('sendMessage', 'Send'),
      createAction('muteUser', 'Mute'),
      createAction('blockUser', 'Block'),
      createAction('removeUser', 'Remove'),
    ];

    renderWithChannel(
      <ChannelMemberDetail
        channelMemberActionSet={actionSet}
        layout='inline'
        member={ownMember}
      />,
    );

    expect(screen.queryByText('Send')).not.toBeInTheDocument();
    expect(screen.queryByText('Mute')).not.toBeInTheDocument();
    expect(screen.queryByText('Block')).not.toBeInTheDocument();
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });
});
