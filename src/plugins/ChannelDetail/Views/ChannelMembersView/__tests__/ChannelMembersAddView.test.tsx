import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import type { UserResponse } from 'stream-chat';

import { useChatContext, useTranslationContext } from '../../../../../context';
import { useStateStore } from '../../../../../store';
import { ChannelMembersAddView } from '../ChannelMembersAddView';
import {
  createChannel,
  createUserSearchSource,
  emitChannelEvent,
  getSelectableMemberButton,
  querySelectableMemberButton,
  renderWithChannel,
} from './testUtils';

const mocks = vi.hoisted(() => ({
  infiniteScrollPaginatorRenderCount: 0,
}));

vi.mock('../../../../../context');
vi.mock('../../../../../store');

vi.mock('../../../../../components/Notifications', () => ({
  useNotificationApi: () => ({
    addNotification: vi.fn(),
  }),
}));

vi.mock(
  '../../../../../components/InfiniteScrollPaginator/InfiniteScrollPaginator',
  () => ({
    InfiniteScrollPaginator: ({ children }: { children: React.ReactNode }) => {
      mocks.infiniteScrollPaginatorRenderCount += 1;
      return <div data-testid='infinite-scroll-paginator'>{children}</div>;
    },
  }),
);

vi.mock('../../../../../components/Dialog', () => ({
  Prompt: {
    Body: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Footer: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
    FooterControls: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    FooterControlsButtonPrimary: (
      props: React.ButtonHTMLAttributes<HTMLButtonElement>,
    ) => <button {...props} />,
  },
}));

const searchUsers: UserResponse[] = [
  { id: 'user-2', name: 'Bob' },
  { id: 'user-3', name: 'Carol' },
];

describe('ChannelMembersAddView', () => {
  const setMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.infiniteScrollPaginatorRenderCount = 0;

    vi.mocked(useTranslationContext).mockReturnValue({
      t: (key: string, options?: { count?: number }) =>
        options?.count ? `${key}:${options.count}` : key,
    } as ReturnType<typeof useTranslationContext>);

    vi.mocked(useChatContext).mockReturnValue({
      client: { user: { id: 'user-1' } },
      mutes: [],
    } as ReturnType<typeof useChatContext>);

    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      users: searchUsers,
    });
  });

  it('lists existing channel members as non-selectable and flags them', () => {
    const { searchSource } = createUserSearchSource();

    renderWithChannel(
      <ChannelMembersAddView
        modeController={{ mode: 'add', setMode }}
        searchSource={searchSource}
      />,
      createChannel({
        members: {
          'user-2': { user: { id: 'user-2', name: 'Bob' }, user_id: 'user-2' },
        },
      }),
    );

    // Non-members remain selectable.
    expect(getSelectableMemberButton('Carol')).toBeInTheDocument();
    // Existing members are shown, flagged, and not selectable.
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Already a member')).toBeInTheDocument();
    expect(querySelectableMemberButton('Bob')).toBeNull();
  });

  it('shows selectable rows and add footer when update-channel-members is granted', async () => {
    const channel = createChannel({ ownCapabilities: ['update-channel-members'] });
    const { searchSource } = createUserSearchSource();

    renderWithChannel(
      <ChannelMembersAddView
        modeController={{ mode: 'add', setMode }}
        searchSource={searchSource}
      />,
      channel,
    );

    // Non-members are not flagged as members.
    expect(screen.queryByText('Already a member')).not.toBeInTheDocument();

    fireEvent.click(getSelectableMemberButton('Bob'));
    fireEvent.click(getSelectableMemberButton('Carol'));

    expect(
      screen.getByRole('button', { name: 'Add {{ count }} members:2' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add {{ count }} members:2' }));

    await waitFor(() => {
      expect(channel.addMembers).toHaveBeenCalledWith(['user-2', 'user-3']);
      expect(setMode).toHaveBeenCalledWith('browse');
    });
  });

  it('reactively flags a user as a member after a member.added event', () => {
    const { searchSource } = createUserSearchSource();
    const channel = createChannel({
      members: {
        'user-1': { user: { id: 'user-1', name: 'Alice' }, user_id: 'user-1' },
      },
    });

    renderWithChannel(
      <ChannelMembersAddView
        modeController={{ mode: 'add', setMode }}
        searchSource={searchSource}
      />,
      channel,
    );

    // Bob starts selectable and is not flagged as a member.
    expect(getSelectableMemberButton('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Already a member')).not.toBeInTheDocument();

    // Bob joins the channel; the view reflects it without a remount.
    channel.state.members['user-2'] = {
      user: { id: 'user-2', name: 'Bob' },
      user_id: 'user-2',
    };
    emitChannelEvent(channel, 'member.added');

    expect(screen.getByText('Already a member')).toBeInTheDocument();
    expect(querySelectableMemberButton('Bob')).toBeNull();
  });

  it('clears the selection (and add footer) after a successful add', async () => {
    const channel = createChannel({ ownCapabilities: ['update-channel-members'] });
    const { searchSource } = createUserSearchSource();

    renderWithChannel(
      <ChannelMembersAddView
        modeController={{ mode: 'add', setMode }}
        searchSource={searchSource}
      />,
      channel,
    );

    fireEvent.click(getSelectableMemberButton('Bob'));
    expect(
      screen.getByRole('button', { name: /Add {{ count }} members/ }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Add {{ count }} members/ }));

    await waitFor(() => expect(channel.addMembers).toHaveBeenCalledWith(['user-2']));

    expect(
      screen.queryByRole('button', { name: /Add {{ count }} members/ }),
    ).not.toBeInTheDocument();
  });

  it('does not show selection UI or add footer without update-channel-members', () => {
    const channel = createChannel({ ownCapabilities: [] });
    const { searchSource } = createUserSearchSource();

    renderWithChannel(
      <ChannelMembersAddView
        modeController={{ mode: 'add', setMode }}
        searchSource={searchSource}
      />,
      channel,
    );

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bob' })).not.toBeInTheDocument();
    expect(
      document.querySelector('.str-chat__channel-detail__channel-members-view__checkbox'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Add {{ count }} members/ }),
    ).not.toBeInTheDocument();
  });

  it('triggers search on input change', () => {
    const { search, searchSource } = createUserSearchSource();

    renderWithChannel(
      <ChannelMembersAddView
        modeController={{ mode: 'add', setMode }}
        searchSource={searchSource}
      />,
    );

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'car' } });

    expect(search).toHaveBeenCalledWith('car');
  });

  it('does not re-render user results while typing before source state changes', () => {
    const { searchSource } = createUserSearchSource();

    renderWithChannel(
      <ChannelMembersAddView
        modeController={{ mode: 'add', setMode }}
        searchSource={searchSource}
      />,
    );

    const renderCount = mocks.infiniteScrollPaginatorRenderCount;
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'car' } });

    expect(mocks.infiniteScrollPaginatorRenderCount).toBe(renderCount);
  });
});
