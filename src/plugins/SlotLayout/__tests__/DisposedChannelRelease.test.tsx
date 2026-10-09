import React from 'react';
import { act, render } from '@testing-library/react';
import type { Channel, StreamChat } from 'stream-chat';

import { ChatView } from '../ChatView';
import { DisposedChannelRelease } from '../DisposedChannelRelease';
import { LayoutController } from '../layoutController/LayoutController';
import { createChatViewSlotBinding, getChatViewEntityBinding } from '../slotBinding';
import { ChatProvider } from '../../../context/ChatContext';
import type { ChatContextValue } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import type { TranslationContextValue } from '../../../context/TranslationContext';
import { getTestClientWithUser } from '../../../mock-builders';
import { mockT } from '../../../mock-builders/translator';

vi.mock('../../../components/Channel/Channel', () => ({
  Channel: () => null,
}));

describe('DisposedChannelRelease', () => {
  let client: StreamChat;
  let channel: Channel;
  let layoutController: LayoutController;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'ann' });
    channel = client.channelManager.ensure({ id: 'general', type: 'messaging' });
    layoutController = new LayoutController({
      initialState: { availableSlots: ['slot1'] },
    });
    layoutController.bind(
      'slot1',
      createChatViewSlotBinding({ key: channel.cid, kind: 'channel', source: channel }),
    );
  });

  const boundSource = () => {
    const state = layoutController.state.getLatestValue();
    const viewState = state.layouts?.[state.activeView];
    return getChatViewEntityBinding(viewState?.slotBindings.slot1)?.source;
  };

  const renderInChatView = () =>
    render(
      <ChatProvider value={{ client } as unknown as ChatContextValue}>
        <TranslationProvider
          value={{ t: mockT, userLanguage: 'en' } as TranslationContextValue}
        >
          <ChatView layoutController={layoutController}>
            <DisposedChannelRelease />
          </ChatView>
        </TranslationProvider>
      </ChatProvider>,
    );

  it('leaves a live channel in its slot', () => {
    renderInChatView();

    expect(boundSource()).toBe(channel);
  });

  it('empties the slot when its channel is deleted', () => {
    renderInChatView();

    act(() => {
      client.dispatchEvent({
        channel: { cid: channel.cid, id: 'general', type: 'messaging' },
        channel_id: 'general',
        channel_type: 'messaging',
        cid: channel.cid,
        type: 'channel.deleted',
      } as never);
    });

    expect(channel.pendingDisposal).toBe(true);
    expect(boundSource()).toBeUndefined();
  });

  it('empties the slot when the current user is removed from its channel', () => {
    renderInChatView();

    act(() => {
      client.dispatchEvent({
        cid: channel.cid,
        type: 'notification.removed_from_channel',
      } as never);
    });

    expect(boundSource()).toBeUndefined();
  });

  it('leaves a slot that shows another channel', () => {
    const other = client.channelManager.ensure({ id: 'other', type: 'messaging' });
    renderInChatView();

    act(() => {
      layoutController.bind(
        'slot1',
        createChatViewSlotBinding({ key: other.cid, kind: 'channel', source: other }),
      );
      client.dispatchEvent({
        cid: channel.cid,
        type: 'channel.deleted',
      } as never);
    });

    expect(boundSource()).toBe(other);
  });
});
