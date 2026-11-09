import React, { forwardRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
import { GroupedVirtuoso } from 'react-virtuoso';
import { Thread } from 'stream-chat';
import type { StreamChat, UserResponse } from 'stream-chat';
import { commands, userEvent } from 'vitest/browser';

import '../../../../plugins/ChannelDetail/styling/index.scss';
import { Chat } from '../../../Chat';
import { ThreadList } from '../../../Threads/ThreadList';
import { VirtualizedList } from '../../../../plugins/ChannelDetail/VirtualizedList';
import { generateMessage, getTestClientWithUser } from '../../../../mock-builders';
import { nextFrame, settle, waitUntil } from './harness';
import { describeDom, RUNTIME } from './trace';
import { probe, resetProbe } from './virtuosoProbe';
import { buildHistory, installFakeBackend } from './fakeBackend';
import { createRng } from './prng';

// The same probe as the message-list suites: it records the SDK ↔ Virtuoso calls of `Virtuoso`.
// `GroupedVirtuoso` is passed through unwrapped.
vi.mock('react-virtuoso', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-virtuoso')>();
  const { wrapVirtuoso } = await import('./virtuosoProbe');
  return { ...actual, Virtuoso: wrapVirtuoso(actual.Virtuoso as never) };
});

const unmounts: (() => void)[] = [];
afterEach(() => {
  unmounts.splice(0).forEach((unmount) => unmount());
});

const mount = async (element: React.ReactElement, height = 400) => {
  const container = document.createElement('div');
  container.style.cssText = `height:${height}px;width:420px;display:flex;flex-direction:column`;
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(element);
  unmounts.push(() => {
    root.unmount();
    container.remove();
  });
  await waitUntil(
    () => !!container.querySelector('[data-virtuoso-scroller]'),
    4000,
    'list',
  );
  return container;
};

/** A trace of these simpler lists: the DOM Virtuoso renders and the calls the probe saw. */
const writeTrace = (
  scenario: string,
  frame: HTMLElement,
  extra: Record<string, unknown>,
) =>
  commands.writeVirtuosoTrace(
    scenario,
    JSON.stringify({
      checkpoints: [
        {
          commits: 0,
          dom: describeDom(frame),
          events: probe.events.filter((event) => event.name !== 'itemsRendered'),
          firstVisible: null,
          geometry: null,
          label: 'end',
          messageRenders: 0,
          paginatorCalls: [],
          remounted: [],
          rendered: [],
          requests: [],
          visible: true,
        },
      ],
      consoleErrors: [],
      framesUntilFirstItem: null,
      metrics: extra,
      runtime: RUNTIME,
      scenario,
      windowErrors: [],
    }),
  );

describe('other virtualized lists in a real browser', () => {
  it('B-15 ThreadList: arrow keys reach rows outside the rendered window', async () => {
    resetProbe();
    const user = { id: 'own-user' } as UserResponse;
    const client = (await getTestClientWithUser(user)) as StreamChat;
    const history = buildHistory({ count: 60, rng: createRng(5), users: [user] });
    installFakeBackend({ channelId: 'threads', client, history, users: [user] });
    const channel = client.channel('messaging', 'threads');
    const threads = history.map(
      (message) =>
        new Thread({ channel, client, parentMessage: { ...message, reply_count: 2 } }),
    );
    vi.spyOn(client.threads, 'reload').mockResolvedValue(undefined);
    const toTail = vi
      .spyOn(client.threads.paginator, 'toTail')
      .mockResolvedValue(undefined as never);
    client.threads.paginator.state.partialNext({ isLoading: false, items: threads });

    const frame = await mount(
      <Chat client={client}>
        <ThreadList />
      </Chat>,
      500,
    );
    const scroller = frame.querySelector<HTMLElement>('[data-virtuoso-scroller]');
    await waitUntil(() => !!frame.querySelector('[role="option"]'), 4000, 'rows');
    await settle(frame);
    expect(scroller?.getAttribute('role'), 'listbox on the scroller').toBe('listbox');

    frame.querySelector<HTMLElement>('[role="option"]')?.focus();
    const target = 25;
    for (let i = 0; i < target; i += 1) {
      await userEvent.keyboard('{ArrowDown}');
      await nextFrame();
    }
    await waitUntil(
      () =>
        (document.activeElement as HTMLElement | null)
          ?.closest('[data-thread-id]')
          ?.getAttribute('data-thread-id') === threads[target].id,
      4000,
      'focus on the 26th thread',
    );
    const focused = (document.activeElement as HTMLElement).getBoundingClientRect();
    const box = scroller!.getBoundingClientRect();
    expect(focused.top, 'focused row inside the viewport').toBeGreaterThanOrEqual(
      box.top - 1,
    );
    expect(focused.bottom).toBeLessThanOrEqual(box.bottom + 1);
    await writeTrace('B-15-thread-list-keyboard', frame, {
      toTailCalls: toTail.mock.calls.length,
    });
  });

  it('B-16 ChannelFilesView layout: month headers stick to the top', async () => {
    const Group = forwardRef<HTMLDivElement, ComponentProps<'div'>>(function Group(
      { className, ...props },
      ref,
    ) {
      return (
        <div
          {...props}
          className={`str-chat__channel-detail__files-view__group ${className ?? ''}`}
          ref={ref}
        />
      );
    });
    const groupCounts = [30, 30, 30];
    const frame = await mount(
      <GroupedVirtuoso
        className='str-chat__virtualized-list str-chat__channel-detail__files-view__list'
        components={{ Group }}
        groupContent={(index) => (
          <div className='str-chat__channel-detail__files-view__section-header'>
            month {index}
          </div>
        )}
        groupCounts={groupCounts}
        itemContent={(index) => <div style={{ height: 40 }}>file {index}</div>}
        style={{ height: 400 }}
      />,
    );
    const scroller = frame.querySelector<HTMLElement>('[data-virtuoso-scroller]')!;
    await settle(frame);
    scroller.scrollTop = 40 * 35;
    await settle(frame);
    const header = Array.from(
      frame.querySelectorAll<HTMLElement>('.str-chat__channel-detail__files-view__group'),
    ).find((element) => element.textContent?.includes('month 1'));
    expect(header, 'month 1 header rendered').toBeDefined();
    expect(getComputedStyle(header!).position).toBe('sticky');
    expect(
      Math.abs(
        header!.getBoundingClientRect().top - scroller.getBoundingClientRect().top,
      ),
      'header pinned at the scroller top',
    ).toBeLessThanOrEqual(1);
    await writeTrace('B-16-files-sticky-groups', frame, {});
  });

  it('B-17 ChannelDetail VirtualizedList: loads the next page once at the bottom', async () => {
    resetProbe();
    const loadNext = vi.fn();
    const items = Array.from({ length: 80 }, (_, i) =>
      generateMessage({ id: `item-${i}`, text: `item ${i}` }),
    );
    const Harness = () => {
      const [data] = useState(items);
      return (
        <VirtualizedList
          aria-label='Pinned messages'
          computeItemKey={(_, item) => item.id}
          data={data}
          itemContent={(_, item) => <div style={{ height: 48 }}>{item.text}</div>}
          loadNext={loadNext}
          role='list'
        />
      );
    };
    const frame = await mount(<Harness />);
    const scroller = frame.querySelector<HTMLElement>('[data-virtuoso-scroller]')!;
    await settle(frame);
    expect(scroller.getAttribute('aria-label')).toBe('Pinned messages');
    expect(scroller.getAttribute('role')).toBe('list');
    scroller.scrollTop = scroller.scrollHeight;
    await settle(frame);
    await waitUntil(() => loadNext.mock.calls.length > 0, 2000, 'loadNext');
    scroller.scrollTop -= 10;
    await nextFrame();
    await settle(frame);
    expect(loadNext, 'loads once while it stays at the bottom').toHaveBeenCalledTimes(1);
    await writeTrace('B-17-channel-detail-load-next', frame, {
      loadNextCalls: loadNext.mock.calls.length,
    });
  });
});
