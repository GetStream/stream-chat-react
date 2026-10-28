import React, { createRef } from 'react';
import type { PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MessageComposer } from 'stream-chat';
import type { Channel, StreamChat } from 'stream-chat';

import { ChannelStateProvider, ChatProvider } from '../../../../context';
import { MessageComposerControllerProvider } from '../../../MessageComposer';
import {
  generateScheduledMessage,
  getTestClientWithUser,
  mockChannelStateContext,
  mockChatContext,
} from '../../../../mock-builders';
import { useScheduleMessageDialog } from '../useScheduleMessageDialog';
import { useScheduleMessageSubmit } from '../useScheduleMessageSubmit';
import { useSchedulePresets } from '../useSchedulePresets';
import { useScheduleTimeForm } from '../useScheduleTimeForm';

const WEDNESDAY_MORNING = new Date(2026, 9, 28, 10, 30);

const createWrapper = (
  client: StreamChat,
  channel: Channel,
  composer: MessageComposer,
) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <ChatProvider value={mockChatContext({ client })}>
      <ChannelStateProvider value={mockChannelStateContext({ channel })}>
        <MessageComposerControllerProvider messageComposerController={composer}>
          {children}
        </MessageComposerControllerProvider>
      </ChannelStateProvider>
    </ChatProvider>
  );

  return Wrapper;
};

const setup = async () => {
  const client = await getTestClientWithUser({ id: 'user-id' });
  const channel = client.channel('messaging', 'general');
  const composer = new MessageComposer({ client, compositionContext: channel });
  const wrapper = createWrapper(client, channel, composer);

  return { client, composer, wrapper };
};

const deferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });

  return { promise, reject, resolve };
};

describe('scheduled message hooks', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
    vi.setSystemTime(WEDNESDAY_MORNING);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('useSchedulePresets', () => {
    it('computes nothing while the menu is closed', async () => {
      const { wrapper } = await setup();

      const { rerender, result } = renderHook(() => useSchedulePresets(false), {
        wrapper,
      });
      const closedPresets = result.current;
      rerender();

      expect(closedPresets).toEqual([]);
      expect(result.current).toBe(closedPresets);
    });

    it('keeps the same presets across re-renders while the menu is open', async () => {
      const { wrapper } = await setup();

      const { rerender, result } = renderHook(() => useSchedulePresets(true), {
        wrapper,
      });
      const openPresets = result.current;
      rerender();

      expect(openPresets).toHaveLength(3);
      expect(result.current).toBe(openPresets);
    });
  });

  describe('useScheduleTimeForm', () => {
    it('starts at the next whole hour after the earliest time', async () => {
      const { wrapper } = await setup();

      const { result } = renderHook(() => useScheduleTimeForm(), { wrapper });

      expect(result.current.dateValue).toBe('2026-10-28');
      expect(result.current.timeValue).toBe('11:00');
      expect(result.current.scheduledAt).toEqual(new Date(2026, 9, 28, 11, 0));
      expect(result.current.timeError).toBeUndefined();
    });

    it('keeps handlers and the picked time stable across re-renders', async () => {
      const { wrapper } = await setup();

      const { rerender, result } = renderHook(() => useScheduleTimeForm(), { wrapper });
      const { onDateChange, onTimeChange, scheduledAt } = result.current;
      rerender();

      expect(result.current.onDateChange).toBe(onDateChange);
      expect(result.current.onTimeChange).toBe(onTimeChange);
      expect(result.current.scheduledAt).toBe(scheduledAt);
    });
  });

  describe('useScheduleMessageSubmit', () => {
    it('calls onScheduled after a successful schedule', async () => {
      const { composer, wrapper } = await setup();
      vi.spyOn(composer, 'schedule').mockResolvedValue(generateScheduledMessage());
      const onScheduled = vi.fn();

      const { result } = renderHook(() => useScheduleMessageSubmit(onScheduled), {
        wrapper,
      });
      await act(() => result.current.submit(new Date(2026, 9, 29, 9)));

      expect(onScheduled).toHaveBeenCalledTimes(1);
      expect(result.current.hasFailed).toBe(false);
      expect(result.current.isScheduling).toBe(false);
    });

    it('reports a failure and allows another attempt', async () => {
      const { composer, wrapper } = await setup();
      vi.spyOn(composer, 'schedule').mockRejectedValue(new Error('failed'));
      const onScheduled = vi.fn();

      const { result } = renderHook(() => useScheduleMessageSubmit(onScheduled), {
        wrapper,
      });
      await act(() => result.current.submit(new Date(2026, 9, 29, 9)));

      expect(onScheduled).not.toHaveBeenCalled();
      expect(result.current.hasFailed).toBe(true);
      expect(result.current.isScheduling).toBe(false);
    });

    it('does not call onScheduled after unmount when the request succeeds late', async () => {
      const { composer, wrapper } = await setup();
      const pendingSchedule = deferred<undefined>();
      vi.spyOn(composer, 'schedule').mockReturnValue(pendingSchedule.promise);
      const onScheduled = vi.fn();
      const consoleError = vi.spyOn(console, 'error');

      const { result, unmount } = renderHook(
        () => useScheduleMessageSubmit(onScheduled),
        {
          wrapper,
        },
      );
      let submitting: Promise<void> = Promise.resolve();
      act(() => {
        submitting = result.current.submit(new Date(2026, 9, 29, 9));
      });
      unmount();
      pendingSchedule.resolve(undefined);
      await submitting;

      expect(onScheduled).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });
  });

  describe('useScheduleMessageDialog', () => {
    it('returns focus to the trigger after closing when focus fell to the body', () => {
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      const returnFocusRef = createRef<HTMLButtonElement>();
      Object.assign(returnFocusRef, { current: trigger });
      const requestFrame = vi
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((callback) => {
          callback(0);
          return 1;
        });

      const { result } = renderHook(() => useScheduleMessageDialog(returnFocusRef));
      act(() => result.current.openDialog());
      act(() => result.current.closeDialog());

      expect(result.current.isDialogOpen).toBe(false);
      expect(requestFrame).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(trigger);

      trigger.remove();
    });

    it('cancels the pending focus restore on unmount', () => {
      const returnFocusRef = createRef<HTMLButtonElement>();
      vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42);
      const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame');

      const { result, unmount } = renderHook(() =>
        useScheduleMessageDialog(returnFocusRef),
      );
      act(() => result.current.openDialog());
      act(() => result.current.closeDialog());
      unmount();

      expect(cancelFrame).toHaveBeenCalledWith(42);
    });

    it('keeps open and close stable across re-renders', () => {
      const returnFocusRef = createRef<HTMLButtonElement>();

      const { rerender, result } = renderHook(() =>
        useScheduleMessageDialog(returnFocusRef),
      );
      const { closeDialog, openDialog } = result.current;
      rerender();

      expect(result.current.openDialog).toBe(openDialog);
      expect(result.current.closeDialog).toBe(closeDialog);
    });
  });
});
