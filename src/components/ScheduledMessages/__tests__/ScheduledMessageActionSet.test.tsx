import React, { type PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';
import { SCHEDULED_MESSAGE_FAILURE_REASON } from 'stream-chat';
import type { ScheduledMessageResponse } from 'stream-chat';

import { generateScheduledMessage } from '../../../mock-builders';
import {
  defaultScheduledMessageActionSet,
  ScheduledMessageActionsContextProvider,
  useBaseScheduledMessageActionSetFilter,
} from '../ScheduledMessageActions';
import type { ScheduledMessageActionSetItem } from '../ScheduledMessageActions';

const Noop = () => null;

const filterActions = ({
  actionSet = defaultScheduledMessageActionSet,
  canOpenInComposer = true,
  scheduledMessage = generateScheduledMessage({ message: { custom: {}, text: 'Hi' } }),
}: {
  actionSet?: ScheduledMessageActionSetItem[];
  canOpenInComposer?: boolean;
  scheduledMessage?: ScheduledMessageResponse;
} = {}) => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <ScheduledMessageActionsContextProvider
      value={{
        canEdit: true,
        editUnavailableDescriptionId: 'edit-unavailable',
        isPending: false,
        openDialog: vi.fn(),
        openInComposer: canOpenInComposer ? vi.fn() : undefined,
        runRequest: vi.fn(),
        scheduledMessage,
      }}
    >
      {children}
    </ScheduledMessageActionsContextProvider>
  );
  const { result } = renderHook(() => useBaseScheduledMessageActionSetFilter(actionSet), {
    wrapper,
  });
  return result.current.map((action) =>
    action.placement === 'quick-dropdown-toggle'
      ? 'toggle'
      : `${action.placement}:${action.type}`,
  );
};

describe('useBaseScheduledMessageActionSetFilter', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn() },
    });
  });

  it('offers a waiting message its own edit button and reschedule, send now and delete', () => {
    expect(filterActions()).toEqual([
      'toggle',
      'quick:edit',
      'dropdown:reschedule',
      'dropdown:sendNow',
      'dropdown:delete',
    ]);
  });

  it('offers no edit without openInComposer', () => {
    expect(filterActions({ canOpenInComposer: false })).not.toContain('quick:edit');
  });

  it('offers nothing while the message is being sent', () => {
    expect(
      filterActions({
        scheduledMessage: generateScheduledMessage({ status: 'sending' }),
      }),
    ).toEqual(['toggle']);
  });

  it('offers a failed message edit and delete from the menu', () => {
    expect(
      filterActions({
        scheduledMessage: generateScheduledMessage({
          failure_reason: SCHEDULED_MESSAGE_FAILURE_REASON.ChannelFrozen,
          status: 'failed',
        }),
      }),
    ).toEqual(['toggle', 'dropdown:edit', 'dropdown:delete']);
  });

  it('offers copy and delete for a message whose channel was deleted', () => {
    const failed = generateScheduledMessage({
      failure_reason: SCHEDULED_MESSAGE_FAILURE_REASON.ChannelDeleted,
      message: { custom: {}, text: 'Launch moved' },
      status: 'failed',
    });

    expect(filterActions({ scheduledMessage: failed })).toEqual([
      'toggle',
      'dropdown:copyMessageText',
      'dropdown:delete',
    ]);
  });

  it('hides copy without a clipboard or without text', () => {
    const failed = (text?: string) =>
      generateScheduledMessage({
        failure_reason: SCHEDULED_MESSAGE_FAILURE_REASON.ChannelDeleted,
        message: { custom: {}, text },
        status: 'failed',
      });

    expect(filterActions({ scheduledMessage: failed() })).not.toContain(
      'dropdown:copyMessageText',
    );
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    expect(filterActions({ scheduledMessage: failed('Launch moved') })).not.toContain(
      'dropdown:copyMessageText',
    );
  });

  it('lets an action of another type through, subject to its own isVisible', () => {
    const actionSet: ScheduledMessageActionSetItem[] = [
      ...defaultScheduledMessageActionSet,
      { Component: Noop, placement: 'dropdown', type: 'copyLink' },
      { Component: Noop, isVisible: () => false, placement: 'dropdown', type: 'hidden' },
    ];

    expect(
      filterActions({
        actionSet,
        scheduledMessage: generateScheduledMessage({ status: 'sending' }),
      }),
    ).toEqual(['toggle', 'dropdown:copyLink']);
  });

  it('cannot show an action the status rules out', () => {
    const actionSet = defaultScheduledMessageActionSet.map((action) =>
      action.placement !== 'quick-dropdown-toggle' && action.type === 'sendNow'
        ? { ...action, isVisible: () => true }
        : action,
    );

    expect(
      filterActions({
        actionSet,
        scheduledMessage: generateScheduledMessage({ status: 'sending' }),
      }),
    ).toEqual(['toggle']);
  });
});
