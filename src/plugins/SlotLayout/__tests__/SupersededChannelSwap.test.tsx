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

  const boundEntity = () => {
    const state = layoutController.state.getLatestValue();
    const viewState = state.layouts?.[state.activeView];
    return getChatViewEntityBinding(viewState?.slotBindings.slot1);
  };
  const boundChannel = () => boundEntity()?.source;

  const renderSwap = () =>
    render(
      <SupersededChannelSwap
        channel={previous}
        layoutController={layoutController}
        slot='slot1'
      />,
    );

  it('binds the slot again under the real cid once a channel created from members gets it', () => {
    const created = client.channelManager.ensure({
      data: { members: [{ user_id: 'ann' }, { user_id: 'bob' }] },
      type: 'messaging',
    });
    const temporaryCid = created.cid;
    layoutController.bind(
      'slot1',
      createChatViewSlotBinding({ key: temporaryCid, kind: 'channel', source: created }),
    );
    render(
      <SupersededChannelSwap
        bindingKey={temporaryCid}
        channel={created}
        layoutController={layoutController}
        slot='slot1'
      />,
    );
    const bind = vi.spyOn(layoutController, 'bind');

    // what the first query does: the channel takes its real id and cid, then is marked initialized
    act(() => {
      created.id = '!members-real';
      created.cid = 'messaging:!members-real';
      created.state.partialNext({ initialized: true });
    });

    expect(boundEntity()?.key).toBe('messaging:!members-real');
    expect(boundChannel()).toBe(created);
    expect(bind).toHaveBeenCalledTimes(1);
  });

  it('leaves a slot whose key is its channel cid as it is', () => {
    const bind = vi.spyOn(layoutController, 'bind');
    render(
      <SupersededChannelSwap
        bindingKey={previous.cid}
        channel={previous}
        layoutController={layoutController}
        slot='slot1'
      />,
    );

    act(() => {
      previous.state.partialNext({ initialized: true });
    });

    expect(bind).not.toHaveBeenCalled();
  });

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

  it('keeps a binding the slot got after its channel was superseded', () => {
    const other = client.channelManager.ensure({ id: 'other', type: 'messaging' });
    renderSwap();

    // the slot is bound to another channel before the swap's effect runs
    act(() => {
      previous.state.partialNext({ supersededBy: successor });
      layoutController.bind(
        'slot1',
        createChatViewSlotBinding({ key: other.cid, kind: 'channel', source: other }),
      );
    });

    expect(boundChannel()).toBe(other);
  });

  it('keeps a binding the slot got before its channel took its real cid', () => {
    const created = client.channelManager.ensure({
      data: { members: [{ user_id: 'ann' }, { user_id: 'bob' }] },
      type: 'messaging',
    });
    const other = client.channelManager.ensure({ id: 'other', type: 'messaging' });
    layoutController.bind(
      'slot1',
      createChatViewSlotBinding({ key: created.cid, kind: 'channel', source: created }),
    );
    render(
      <SupersededChannelSwap
        bindingKey={created.cid}
        channel={created}
        layoutController={layoutController}
        slot='slot1'
      />,
    );

    act(() => {
      created.id = '!members-real';
      created.cid = 'messaging:!members-real';
      created.state.partialNext({ initialized: true });
      layoutController.bind(
        'slot1',
        createChatViewSlotBinding({ key: other.cid, kind: 'channel', source: other }),
      );
    });

    expect(boundChannel()).toBe(other);
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
