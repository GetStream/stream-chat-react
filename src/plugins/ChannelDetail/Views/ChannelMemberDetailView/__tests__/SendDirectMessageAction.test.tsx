import { act, fireEvent, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import React from 'react';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import {
  useChatContext,
  useComponentContext,
  useComponentContextIcons,
  useModalContext,
  useTranslationContext,
} from '../../../../../context';
import * as DEFAULT_ICONS from '../../../../../components/Icons/icons';
import { ChannelDetailProvider } from '../../../ChannelDetailContext';
import {
  ChannelMemberActionProvider,
  DefaultChannelMemberActions,
} from '../ChannelMemberActions.defaults';
import { mockT } from '../../../../../mock-builders/translator';

vi.mock('../../../../../context');

const mockOpen = vi.fn();
vi.mock('../../../../SlotLayout', () => ({
  useChatViewNavigation: () => ({ open: mockOpen }),
}));

vi.mock('../../../../../components/Notifications', () => ({
  useNotificationApi: () => ({ addNotification: vi.fn() }),
}));

const member = fromPartial<ChannelMemberResponse>({
  user: { id: 'user-2', name: 'Bob' },
  user_id: 'user-2',
});

describe('SendDirectMessage action', () => {
  const ingestChannel = vi.fn();

  const renderAction = (created: Channel) => {
    vi.mocked(useChatContext).mockReturnValue({
      channelManager: { ingestChannel },
      client: { channelManager: { ensure: () => created }, userID: 'user-me' },
    } as unknown as ReturnType<typeof useChatContext>);
    render(
      <ChannelDetailProvider channel={fromPartial<Channel>({ type: 'messaging' })}>
        <ChannelMemberActionProvider
          value={{ member, memberDisplayName: 'Bob', targetUserId: 'user-2' }}
        >
          <DefaultChannelMemberActions.SendDirectMessage />
        </ChannelMemberActionProvider>
      </ChannelDetailProvider>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useComponentContextIcons).mockReturnValue(DEFAULT_ICONS);
    vi.mocked(useTranslationContext).mockReturnValue({
      t: mockT,
    } as ReturnType<typeof useTranslationContext>);
    vi.mocked(useModalContext).mockReturnValue({
      close: vi.fn(),
    } as ReturnType<typeof useModalContext>);
    vi.mocked(useComponentContext).mockReturnValue(
      {} as ReturnType<typeof useComponentContext>,
    );
  });

  it('opens and lists the direct message once it is watched', async () => {
    const created = fromPartial<Channel>({ cid: 'messaging:dm' });
    (created as { ensureWatched: () => Promise<Channel> }).ensureWatched = () =>
      Promise.resolve(created);
    renderAction(created);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
      await Promise.resolve();
    });

    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'messaging:dm', source: created }),
    );
    expect(ingestChannel).toHaveBeenCalledWith(created);
  });

  it('opens and lists the stored instance when the direct message was superseded during its watch', async () => {
    const stored = fromPartial<Channel>({ cid: 'messaging:dm' });
    const created = fromPartial<Channel>({ cid: 'messaging:dm', supersededBy: stored });
    // as stream-chat does: `ensureWatched()` resolves with the instance that superseded it
    (created as { ensureWatched: () => Promise<Channel> }).ensureWatched = () =>
      Promise.resolve(stored);
    renderAction(created);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
      await Promise.resolve();
    });

    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'messaging:dm', source: stored }),
    );
    expect(ingestChannel).toHaveBeenCalledWith(stored);
  });
});
