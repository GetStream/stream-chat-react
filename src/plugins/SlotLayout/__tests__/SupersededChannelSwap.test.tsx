import React from 'react';
import { act, render } from '@testing-library/react';
import type { Channel, StreamChat } from 'stream-chat';

import { SupersededChannelSwap } from '../SupersededChannelSwap';
import { LayoutController } from '../layoutController/LayoutController';
import { createChatViewSlotBinding, getChatViewEntityBinding } from '../slotBinding';
import { getTestClientWithUser } from '../../../mock-builders';

describe('SupersededChannelSwap', () => {
  let client: StreamChat;
  let previous: Channel;
  let successor: Channel;
  let layoutController: LayoutController;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'ann' });
    previous = client.channelManager.ensure({ id: 'previous', type: 'messaging' });
    successor = client.channelManager.ensure({ id: 'successor', type: 'messaging' });
    layoutController = new LayoutController({
      initialState: { availableSlots: ['slot1'] },
    });
    layoutController.bind(
      'slot1',
      createChatViewSlotBinding({ key: previous.cid, kind: 'channel', source: previous }),
    );
  });

  const boundChannel = () => {
    const state = layoutController.state.getLatestValue();
    const viewState = state.layouts?.[state.activeView];
    return getChatViewEntityBinding(viewState?.slotBindings.slot1)?.source;
  };

  const renderSwap = () =>
    render(
      <SupersededChannelSwap
        channel={previous}
        layoutController={layoutController}
        slot='slot1'
      />,
    );

  it('leaves a channel that is not superseded in its slot', () => {
    renderSwap();

    expect(boundChannel()).toBe(previous);
  });

  it('moves the slot to the instance that superseded its channel', () => {
    renderSwap();

    act(() => {
      previous.state.partialNext({ supersededBy: successor });
    });

    expect(boundChannel()).toBe(successor);
  });

  it('waits while the successor is open elsewhere and this composer still holds something', () => {
    successor.activate();
    previous.messageComposer.textComposer.setText('unsent');
    renderSwap();

    act(() => {
      previous.state.partialNext({ supersededBy: successor });
    });
    expect(boundChannel()).toBe(previous);

    act(() => {
      previous.messageComposer.clear();
    });
    expect(boundChannel()).toBe(successor);
  });
});
