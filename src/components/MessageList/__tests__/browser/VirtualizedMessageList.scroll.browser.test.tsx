import React, { forwardRef, useState } from 'react';
import type { ListProps } from 'react-virtuoso';
import { commands } from 'vitest/browser';

import {
  isListVisible,
  mountList,
  nextFrame,
  OWN_USER,
  readGeometry,
  readRenderedItems,
  readVisibleItems,
  receiveMessage,
  scrollBy,
  scrollToBottom,
  scrollToTop,
  setMessageHeight,
  settle,
  trackResources,
  unmountAll,
  wait,
  waitUntil,
} from './harness';
import { expectAtBottom } from './invariants';
import { runScenario, SCROLL_TARGET_RETRY_WINDOW_MS } from './scenario';
import { createTrace, RUNTIME } from './trace';
import { VirtualizedMessageList } from '../../VirtualizedMessageList';

// Every Virtuoso the SDK renders goes through the probe, which records the calls crossing the
// SDK ↔ Virtuoso boundary. The same file runs against both runtimes (see vitest.config.ts).
vi.mock('react-virtuoso', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-virtuoso')>();
  const { wrapVirtuoso } = await import('./virtuosoProbe');
  return { ...actual, Virtuoso: wrapVirtuoso(actual.Virtuoso as never) };
});

afterEach(unmountAll);

const loadedCount = (mounted: { channel: { messagePaginator: { items?: unknown[] } } }) =>
  mounted.channel.messagePaginator.items?.length ?? 0;

const clickJumpToLatest = async (frame: HTMLElement) => {
  await waitUntil(
    () =>
      !!frame.ownerDocument.querySelector(
        '[data-testid="scroll-to-latest-message-button"]',
      ),
    2000,
    'jump-to-latest button',
  );
  frame.ownerDocument
    .querySelector<HTMLElement>('[data-testid="scroll-to-latest-message-button"]')
    ?.click();
};

describe('VirtualizedMessageList in a real browser', () => {
  it('B-01 opens at the true bottom', async () => {
    await runScenario('B-01-initial-bottom', {}, ({ mounted }) => {
      expectAtBottom(mounted.frame);
    });
  });

  it('B-01b opens at the true bottom when the last message is taller than the viewport', async () => {
    await runScenario(
      'B-01b-initial-bottom-tall-last',
      { heightFor: (index) => (index === 199 ? 900 : 60) },
      ({ mounted }) => {
        expectAtBottom(mounted.frame);
      },
    );
  });

  it('B-02 opens centered on a focused message', async () => {
    await runScenario(
      'B-02-initial-focus',
      {
        beforeRender: (channel) => channel.messagePaginator.jumpToMessage('m-0120'),
      },
      ({ mounted }) => {
        const geometry = readGeometry(mounted.frame);
        const target = readRenderedItems(mounted.frame).find(
          (item) => item.id === 'm-0120',
        );
        expect(target, 'focused message rendered').toBeDefined();
        const center = (target?.top ?? 0) + (target?.height ?? 0) / 2;
        expect(Math.abs(center - (geometry?.clientHeight ?? 0) / 2)).toBeLessThanOrEqual(
          (target?.height ?? 0) / 2 + 2,
        );
      },
    );
  });

  it('B-03 keeps the reading position while older pages are prepended', async () => {
    await runScenario('B-03-prepend', { pageSize: 25 }, async ({ mounted, step }) => {
      for (let page = 1; page <= 3; page += 1) {
        const before = loadedCount(mounted);
        await scrollBy(
          mounted.frame,
          -(readGeometry(mounted.frame)?.scrollTop ?? 0) + 40,
        );
        await settle(mounted.frame);
        const anchorId = readVisibleItems(mounted.frame)[1]?.id;
        const point = await step(
          `prepend ${page}`,
          async () => {
            await scrollToTop(mounted.frame);
            await waitUntil(() => loadedCount(mounted) > before, 4000, `page ${page}`);
          },
          { anchorId },
        );
        // v2 paints the deviation and the scroll that cancels it in separate frames, which leaves
        // the viewport empty for two frames; v4.18.13 applies both in the same paint.
        // Soft: a failure must not cut the trace short, or the comparison sees missing steps.
        expect
          .soft(point.frames?.blankFrames, 'blank frames')
          .toBeLessThanOrEqual(RUNTIME === 'browser-v2' ? 2 : 0);
        expect
          .soft(point.frames?.maxAnchorShift ?? 0, 'anchor shift')
          .toBeLessThanOrEqual(2);
        expect.soft(point.remounted, 'remounted items').toEqual([]);
      }
    });
  });

  it('B-04 keeps the reading position while prepending under CPU load', async () => {
    const throttled = await commands.setCpuThrottlingRate(6);
    try {
      await runScenario(
        'B-04-prepend-throttled',
        { pageSize: 25 },
        async ({ mounted, step }) => {
          for (let page = 1; page <= 2; page += 1) {
            const before = loadedCount(mounted);
            await scrollBy(
              mounted.frame,
              -(readGeometry(mounted.frame)?.scrollTop ?? 0) + 40,
            );
            await settle(mounted.frame);
            const anchorId = readVisibleItems(mounted.frame)[1]?.id;
            const point = await step(
              `prepend ${page}`,
              async () => {
                await scrollToTop(mounted.frame);
                await waitUntil(
                  () => loadedCount(mounted) > before,
                  8000,
                  `page ${page}`,
                );
              },
              { anchorId, settle: { timeoutMs: 8000 } },
            );
            // Under load only the settled position is held to the bound; transient frames may move.
            expect(point.firstVisible, 'first visible item').not.toBeNull();
          }
        },
      );
    } finally {
      if (throttled) await commands.setCpuThrottlingRate(1);
    }
  });

  it('B-05 follows new messages only when it should', async () => {
    await runScenario('B-05-follow-output', {}, async ({ mounted, step }) => {
      await step('other user, at bottom', () => receiveMessage(mounted, mounted.other), {
        sample: true,
      });
      expectAtBottom(mounted.frame);

      await step('scroll up', () => scrollBy(mounted.frame, -800));
      const scrolledTop = readGeometry(mounted.frame)?.scrollTop ?? 0;

      await step('other user, scrolled up', () => receiveMessage(mounted, mounted.other));
      expect(readGeometry(mounted.frame)?.scrollTop).toBeCloseTo(scrolledTop, 0);
      expect(
        mounted.frame.ownerDocument.querySelector('[data-testid="message-notification"]'),
        'new message notification',
      ).not.toBeNull();

      await step('own message, scrolled up', () => receiveMessage(mounted, OWN_USER), {
        sample: true,
      });
      expectAtBottom(mounted.frame);
    });
  });

  it('B-06 ends at the bottom after a burst of messages with smooth scrolling', async () => {
    await runScenario('B-06-burst', {}, async ({ mounted, step }) => {
      await step(
        'burst of 20',
        async () => {
          for (let i = 0; i < 20; i += 1) {
            await receiveMessage(mounted, mounted.other, 40 + (i % 4) * 30, {
              awaitIngest: false,
            });
            await wait(50);
          }
          // The paginator publishes the last ones after its throttle window: settle on all of them.
          const lastId = mounted.history[mounted.history.length - 1].id;
          await waitUntil(
            () =>
              !!mounted.channel.messagePaginator.items?.some(
                (item) => item.id === lastId,
              ),
            3000,
            'the last message of the burst',
          );
        },
        {
          sample: true,
          settle: { quietFrames: 20, timeoutMs: 6000 },
          timingDependent: true,
        },
      );
      expectAtBottom(mounted.frame);
    });
  });

  it('B-07 stays at the bottom when the last message grows', async () => {
    await runScenario('B-07-last-item-grows', {}, async ({ mounted, step }) => {
      const lastId = mounted.history[mounted.history.length - 1].id;
      await step('grow last by 300px', () => setMessageHeight(lastId, 400), {
        sample: true,
      });
      expectAtBottom(mounted.frame);
    });
  });

  it('B-08 jumps to an older window and back to the latest', async () => {
    // A freshly remounted list can report "at bottom" before its jump scroll lands, and the list
    // then pages back to the latest messages (`toHead`), undoing the jump. That is timing-dependent,
    // so it is measured as a rate over fresh attempts rather than asserted once.
    const attempts = 20;
    let reverted = 0;
    let returnedToBottom = 0;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const mounted = await mountList({ seed: 100 + attempt });
      await settle(mounted.frame);
      await wait(SCROLL_TARGET_RETRY_WINDOW_MS);
      await mounted.channel.messagePaginator.jumpToMessage('m-0060');
      await settle(mounted.frame);
      await wait(300);
      await settle(mounted.frame);
      const landed = readRenderedItems(mounted.frame).some(
        (item) => item.id === 'm-0060',
      );
      if (!landed) reverted += 1;
      if (landed) {
        await wait(SCROLL_TARGET_RETRY_WINDOW_MS);
        await clickJumpToLatest(mounted.frame);
        await settle(mounted.frame);
        const geometry = readGeometry(mounted.frame);
        if ((geometry?.distanceFromBottom ?? Infinity) <= 1) returnedToBottom += 1;
      }
      mounted.unmount();
    }
    await commands.writeVirtuosoTrace(
      'B-08-jump-and-back',
      JSON.stringify({
        checkpoints: [],
        consoleErrors: [],
        framesUntilFirstItem: null,
        // Lower is better for every metric: the comparison flags any increase.
        metrics: {
          jumpNotReturnedToBottom: attempts - reverted - returnedToBottom,
          jumpReverted: reverted,
        },
        runtime: RUNTIME,
        scenario: 'B-08-jump-and-back',
        windowErrors: [],
      }),
    );
    expect(returnedToBottom, 'jumps that returned to the bottom').toBe(
      attempts - reverted,
    );
    expect(reverted, 'jumps undone by paging to the latest').toBeLessThanOrEqual(
      RUNTIME === 'browser-v2' ? attempts : 0,
    );
  }, 240_000);

  it('B-09 shows the next channel promptly on a switch', async () => {
    const first = await mountList({ seed: 1 });
    await settle(first.frame);
    first.unmount();
    await runScenario('B-09-channel-switch', { seed: 2 }, ({ mounted }) => {
      expect(mounted.framesUntilFirstItem, 'frames until the first item').not.toBeNull();
      expectAtBottom(mounted.frame);
    });
  });

  it('B-10 marks a short channel read at its true bottom', async () => {
    await runScenario(
      'B-10-short-list-mark-read',
      { heightFor: () => 60, historySize: 3 },
      async ({ mounted, step }) => {
        await step('wait for mark read', () => wait(300));
        const reads = mounted.backend.requests.filter((request) =>
          request.path.endsWith('/read'),
        );
        expect(reads.length, 'mark-read requests').toBeLessThanOrEqual(1);
      },
    );
  });

  it('B-11 floats the date of the messages scrolled past', async () => {
    await runScenario(
      'B-11-floating-date',
      { gapMinutes: 180, listProps: { withDateSeparator: true } },
      async ({ mounted, step }) => {
        await step('scroll up', () => scrollBy(mounted.frame, -700));
        await scrollBy(mounted.frame, -50);
        const floating = mounted.frame.ownerDocument.querySelector(
          '.str-chat__date-separator--floating',
        );
        mounted.frame.setAttribute('data-floating-date', floating?.textContent ?? '');
        await step('record floating date', () => nextFrame(), { skipInvariants: true });
      },
    );
  });

  it('B-12 treats the first loaded message like any other at the top of the list', async () => {
    // A fully loaded channel read up to its first message. At the top, the first message is on
    // screen, so the reader is not "below the unread separator" and the unread notification stays
    // hidden. If the first item went missing from `itemsRendered`, every rendered message would be
    // unread and the notification would show.
    await runScenario(
      'B-12-first-item-at-top',
      { heightFor: () => 60, historySize: 30, pageSize: 50 },
      async ({ mounted, step }) => {
        const [first, second] = mounted.history;
        await step('set the unread state', () => {
          mounted.channel.messagePaginator.setUnreadSnapshot({
            firstUnreadMessageId: second.id,
            lastReadAt: first.created_at,
            lastReadMessageId: first.id,
            unreadCount: 29,
          });
        });
        await step('scroll to the top', async () => {
          await scrollToTop(mounted.frame);
          await wait(400);
        });
        expect(
          readRenderedItems(mounted.frame)[0]?.id,
          'first message rendered at the top',
        ).toBe(first.id);
        expect(
          mounted.frame.ownerDocument.querySelector(
            '.str-chat__unread-messages-notification',
          ),
          'unread notification hidden while the first message is on screen',
        ).toBeNull();
      },
    );
  });

  it('B-13 measures and releases a custom scroll parent', async () => {
    const resources = trackResources();
    try {
      const ScrollParent = ({
        list,
      }: {
        list: (parent: HTMLElement) => React.ReactElement;
      }) => {
        const [parent, setParent] = useState<HTMLElement | null>(null);
        return (
          <div ref={setParent} style={{ height: 600, overflowY: 'auto' }}>
            {parent && list(parent)}
          </div>
        );
      };
      const baseline = resources.counts();
      const mounted = await mountList({
        measureMount: false,
        wrap: () => (
          <ScrollParent
            list={(parent) => (
              <VirtualizedMessageList
                additionalVirtuosoProps={{ customScrollParent: parent }}
              />
            )}
          />
        ),
      });
      await settle(mounted.frame);
      mounted.unmount();
      await nextFrame();
      expect(resources.counts(), JSON.stringify(resources.pending(), null, 1)).toEqual(
        baseline,
      );
    } finally {
      resources.restore();
    }
  });

  it('B-14 lands exactly at the bottom with fractional item heights', async () => {
    await runScenario(
      'B-14-fractional-heights',
      { heightFor: (index) => 40 + ((index * 7.37) % 50) },
      async ({ mounted, step }) => {
        for (let round = 1; round <= 5; round += 1) {
          await step(`scroll up ${round}`, () => scrollBy(mounted.frame, -1500));
          await step(`jump to latest ${round}`, async () => {
            await clickJumpToLatest(mounted.frame);
            await wait(SCROLL_TARGET_RETRY_WINDOW_MS);
          });
          expectAtBottom(mounted.frame);
        }
      },
    );
  });

  it('B-18 mounts cleanly in StrictMode', async () => {
    await runScenario('B-18-strict-mode', { strictMode: true }, ({ mounted }) => {
      expectAtBottom(mounted.frame);
    });
  });

  it('B-20 renders no more than needed while scrolling and receiving', async () => {
    const result = await runScenario(
      'B-20-render-cost',
      { historySize: 500, pageSize: 100 },
      async ({ mounted, step }) => {
        for (let i = 1; i <= 15; i += 1) {
          await step(`scroll up ${i}`, () => scrollBy(mounted.frame, -400));
        }
        await step('jump to latest', async () => {
          await clickJumpToLatest(mounted.frame);
          await wait(SCROLL_TARGET_RETRY_WINDOW_MS);
        });
        await step('one arrival at bottom', () => receiveMessage(mounted, mounted.other));
      },
    );
    expect(result.trace.checkpoints.length).toBeGreaterThan(0);
  });

  it('B-21 does not paginate while mounting', async () => {
    await runScenario(
      'B-21-no-pagination-on-mount',
      {},
      async ({ checkpoint, mounted }) => {
        await wait(500);
        const point = checkpoint('after 500ms');
        expect(mounted.paginatorCalls, 'paginator calls since mount').not.toContain(
          'toTail',
        );
        expect(point.requests.filter((request) => request.messages?.id_lt)).toEqual([]);
      },
    );
  });

  it('B-22 stays at the bottom while the last message streams in', async () => {
    await runScenario('B-22-streaming-growth', {}, async ({ mounted, step }) => {
      const id = await receiveMessage(mounted, mounted.other, 40);
      await settle(mounted.frame);
      await step(
        'stream 50 chunks',
        async () => {
          for (let chunk = 1; chunk <= 50; chunk += 1) {
            setMessageHeight(id, 40 + chunk * 12);
            await wait(30);
          }
        },
        { sample: true, timingDependent: true },
      );
      expectAtBottom(mounted.frame);
    });
  });

  describe('B-23 never stays hidden', () => {
    const cases: [string, Parameters<typeof mountList>[0]][] = [
      ['one message', { historySize: 1 }],
      ['shorter than the viewport', { heightFor: () => 50, historySize: 4 }],
      ['zero-height last item', { heightFor: (index) => (index === 199 ? 0 : 60) }],
      [
        'focus on a message not loaded',
        {
          beforeRender: (channel) =>
            channel.messagePaginator
              .jumpToMessage('missing-message')
              .catch(() => undefined),
        },
      ],
    ];
    it.each(cases)('%s', async (label, options) => {
      await runScenario(
        `B-23-visible-${label.replace(/\W+/g, '-')}`,
        options ?? {},
        ({ mounted }) => {
          expect(isListVisible(mounted.frame), 'list visible').toBe(true);
        },
      );
    });

    it('empty, then a first message', async () => {
      await runScenario(
        'B-23-visible-empty-then-first',
        { historySize: 0, measureMount: false },
        async ({ mounted, step }) => {
          await step('first message', () => receiveMessage(mounted, mounted.other));
          expect(isListVisible(mounted.frame), 'list visible').toBe(true);
          expect(readVisibleItems(mounted.frame).length).toBeGreaterThan(0);
        },
      );
    });
  });

  it('B-24 handles a message arriving during the first frames', async () => {
    const mounted = await mountList({ measureMount: false });
    const trace = createTrace('B-24-message-during-mount', mounted);
    await nextFrame();
    const id = await receiveMessage(mounted, mounted.other);
    await settle(mounted.frame);
    trace.checkpoint('after an early message');
    await trace.save();
    expect(readRenderedItems(mounted.frame).some((item) => item.id === id)).toBe(true);
    expectAtBottom(mounted.frame);
  });

  it('B-26 records what a scroll right after opening or jumping does', async () => {
    // Characterization only: whether the list keeps the user's scroll or returns to the target is
    // compared across runtimes rather than asserted.
    await runScenario(
      'B-26-early-scroll',
      {},
      async ({ mounted, step }) => {
        await step(
          'scroll up 1500 right after mount',
          () => scrollBy(mounted.frame, -1500),
          {
            skipInvariants: true,
          },
        );
        await wait(SCROLL_TARGET_RETRY_WINDOW_MS);
        await step('scroll up 1500 at rest', () => scrollBy(mounted.frame, -1500));
        await step(
          'jump to latest, then scroll up at once',
          async () => {
            await clickJumpToLatest(mounted.frame);
            await nextFrame();
            await scrollBy(mounted.frame, -1500);
          },
          { skipInvariants: true },
        );
      },
      { quietAfterMountMs: 0 },
    );
  });

  it('B-27 clears the focus signal once the jump target is viewed, and stops re-centering on it', async () => {
    // `MessagePaginator` leaves a jump's highlight countdown to the list. VML starts it once the
    // jumped-to message has been viewed and stops scrolling back to it then, so a reader who scrolls
    // away is not pulled back when a message arrives (before the fix the signal lived until the
    // next jump, and every change of the list re-centered on the target). The target is in the
    // latest page, so arriving messages join the rendered list, which is what re-centered it.
    await runScenario(
      'B-27-focus-signal-recenter',
      { pageSize: 40 },
      async ({ mounted, step }) => {
        const focusSignal = () =>
          mounted.channel.messagePaginator.messageFocusSignal.getLatestValue().signal;
        const firstVisibleId = () => readVisibleItems(mounted.frame)[0]?.id;

        await step('jump to m-0170', () =>
          mounted.channel.messagePaginator.jumpToMessage('m-0170'),
        );
        expect(
          readVisibleItems(mounted.frame).some((item) => item.id === 'm-0170'),
          'jump target in view',
        ).toBe(true);
        expect(focusSignal()?.messageId, 'focus signal lives while counting down').toBe(
          'm-0170',
        );

        // Past the window in which Virtuoso re-applies its scroll target, still within the focus
        // signal's countdown (3s from when the target was viewed).
        await wait(SCROLL_TARGET_RETRY_WINDOW_MS);
        // Sampled: on v4 the messages revealed at the top measure taller than estimated, and for one
        // pass the jumped-to message and the two after it leave the rendered range (and remount);
        // no frame may show the viewport uncovered meanwhile.
        const scrolled = await step(
          'scroll up within the focus window',
          () => scrollBy(mounted.frame, -300),
          { sample: true },
        );
        // Soft: a failure must not cut the trace short, or the comparison sees missing steps.
        expect.soft(scrolled.frames?.blankFrames, 'blank frames').toBe(0);
        const readingAt = firstVisibleId();
        await step('message arrives within the focus window', () =>
          receiveMessage(mounted, mounted.other),
        );
        expect(firstVisibleId(), 'not pulled back to the viewed target').toBe(readingAt);

        await step('focus signal clears', () =>
          waitUntil(() => !focusSignal(), 6000, 'focus signal to clear'),
        );
        await step('another message arrives', () =>
          receiveMessage(mounted, mounted.other),
        );
        expect(firstVisibleId(), 'still where the reader scrolled to').toBe(readingAt);
      },
    );
  });

  it('B-28 does not move on its own with suppressAutoscroll', async () => {
    // react-virtuoso 4 scrolls to the bottom when an item grows unless `followOutput` is `false`,
    // without asking the function, and then re-applies that scroll for ~1s, undoing the reader's.
    await runScenario(
      'B-28-suppressed-autoscroll',
      { listProps: { suppressAutoscroll: true } },
      async ({ mounted, step }) => {
        await step('scroll up a little', () => scrollBy(mounted.frame, -40));
        const before = readGeometry(mounted.frame)?.scrollTop;
        await step('a tall message arrives', () =>
          receiveMessage(mounted, mounted.other, 300),
        );
        expect(readGeometry(mounted.frame)?.scrollTop, 'list did not follow').toBeCloseTo(
          before ?? 0,
          0,
        );
        const loaded = loadedCount(mounted);
        await step('scroll to the top right after', async () => {
          await scrollToTop(mounted.frame);
          await waitUntil(() => loadedCount(mounted) > loaded, 4000, 'older page');
        });
        expect(
          readGeometry(mounted.frame)?.scrollTop,
          'not taken back to the bottom',
        ).toBeLessThan((readGeometry(mounted.frame)?.scrollHeight ?? 0) / 2);
      },
    );
  });

  it.each([360, 600])(
    'B-29 keeps the reading position when a message arrives with suppressAutoscroll (%ipx)',
    async (viewportHeight) => {
      await runScenario(
        `B-29-suppressed-arrival-${viewportHeight}`,
        { listProps: { suppressAutoscroll: true }, viewportHeight },
        async ({ mounted, step }) => {
          const before = readVisibleItems(mounted.frame)[0];
          await step('another user sends twice', async () => {
            await receiveMessage(mounted, mounted.other, 80);
            await receiveMessage(mounted, mounted.other, 80);
          });
          const after = readRenderedItems(mounted.frame).find(
            (item) => item.id === before.id,
          );
          mounted.frame.setAttribute(
            'data-shift',
            String(Math.round((after?.top ?? 0) - before.top)),
          );
          expect(
            Math.abs((after?.top ?? 0) - before.top),
            'first visible message moved',
          ).toBeLessThanOrEqual(2);
        },
      );
    },
  );

  it('B-29b keeps the reading position when suppressAutoscroll is switched on, then messages arrive', async () => {
    await runScenario(
      'B-29b-suppressed-later',
      { viewportHeight: 360 },
      async ({ mounted, step }) => {
        await step('switch suppressAutoscroll on', () => {
          mounted.rerender({ props: { suppressAutoscroll: true } });
        });
        const before = readVisibleItems(mounted.frame)[0];
        await step('another user sends twice', async () => {
          await receiveMessage(mounted, mounted.other, 80);
          await receiveMessage(mounted, mounted.other, 80);
        });
        const after = readRenderedItems(mounted.frame).find(
          (item) => item.id === before.id,
        );
        expect(
          Math.abs((after?.top ?? 0) - before.top),
          'first visible message moved',
        ).toBeLessThanOrEqual(2);
      },
    );
  });

  it('B-30 keeps the DOM nodes of the messages after one deleted in the middle', async () => {
    // Keys come from message IDs (computeItemKey): removing a message must not remount the ones
    // after it, as position-based keys would.
    // With hideDeletedMessages the row disappears, so every message after it changes position.
    await runScenario(
      'B-30-delete-in-the-middle',
      { listProps: { hideDeletedMessages: true } },
      async ({ mounted, step }) => {
        const visible = readVisibleItems(mounted.frame);
        const target = visible[Math.floor(visible.length / 2)];
        const message = mounted.channel.messagePaginator.items?.find(
          (item) => item.id === target.id,
        );
        const point = await step('delete a visible message', () =>
          mounted.client.dispatchEvent({
            channel_id: mounted.channel.id,
            channel_type: mounted.channel.type,
            cid: mounted.channel.cid,
            message: {
              ...message,
              deleted_at: message?.updated_at,
              type: 'deleted',
            } as never,
            type: 'message.deleted',
          } as never),
        );
        expect(point.remounted, 'messages remounted').toEqual([]);
      },
    );
  });

  it('B-31 jumps to a message just above the loaded page, whose window overlaps it', async () => {
    // The "N unread" pill: the first unread message sits just above the loaded page (m-0150 to
    // m-0199), so the page around it (m-0115 to m-0164) overlaps it and the paginator shows the two
    // merged. To the list that looks like 35 prepended messages, but it is a jump: on
    // react-virtuoso 4 the scroll to the target was dropped while it compensated for the prepend,
    // and when the newest messages fell off the end instead, it asked for items past the end of
    // the list (a crash).
    await runScenario('B-31-jump-overlapping-window', {}, async ({ mounted, step }) => {
      const errors: string[] = [];
      const onError = (event: ErrorEvent) => errors.push(event.message);
      window.addEventListener('error', onError);
      try {
        await step(
          'jump to the message above the page',
          () => mounted.channel.messagePaginator.jumpToMessage('m-0140'),
          { sample: true },
        );
      } finally {
        window.removeEventListener('error', onError);
      }
      expect(errors, 'uncaught errors').toEqual([]);
      expect(isListVisible(mounted.frame), 'list visible').toBe(true);
      // v2 can lose the jump to its remount race (see B-08): recorded for the comparison only.
      if (RUNTIME !== 'browser-v2') {
        const visible = readVisibleItems(mounted.frame).map((item) => item.id);
        expect(visible, 'the jumped-to message is in view').toContain('m-0140');
      }
    });
  });

  it('B-32 loads the next newer page with one scroll to the end of an older window', async () => {
    // The messages revealed near the end measure other than estimated, and react-virtuoso 4
    // re-measures them after the scroll: kept at the end through that, the list reports it and loads
    // the next newer page; left short of it, it loads nothing and the reader must scroll again.
    await runScenario('B-32-older-window-end', {}, async ({ mounted, step }) => {
      await step('jump to an older message', () =>
        mounted.channel.messagePaginator.jumpToMessage('m-0060'),
      );
      await wait(SCROLL_TARGET_RETRY_WINDOW_MS);
      const point = await step('scroll to the end', () => scrollToBottom(mounted.frame), {
        sample: true,
      });
      const loadedNewer = point.requests.some(
        (request) => !!(request as { messages?: { id_gt?: string } }).messages?.id_gt,
      );
      if (RUNTIME !== 'browser-v2') {
        expect(loadedNewer, 'the next newer page requested').toBe(true);
      }
    });
  });

  it("B-33 does not follow new messages an integrator's followOutput callback declines", async () => {
    // Virtuoso applies the integrator's `followOutput`; the SDK's own growth correction must not
    // pin the list to the new bottom behind its back.
    await runScenario(
      'B-33-integrator-follow-output',
      { listProps: { additionalVirtuosoProps: { followOutput: () => false } } },
      async ({ mounted, step }) => {
        const scrollTop = readGeometry(mounted.frame)?.scrollTop ?? 0;
        await step(
          'other user, at bottom',
          () => receiveMessage(mounted, mounted.other, 300),
          // The list stays put by design, short of its new bottom.
          { skipInvariants: true },
        );
        expect(readGeometry(mounted.frame)?.scrollTop, 'scroll position').toBeCloseTo(
          scrollTop,
          0,
        );
      },
    );
  });

  it('B-34 does not paginate while positioning a custom list that renders no test IDs', async () => {
    // The guard against paging while Virtuoso positions the hidden list must not depend on the
    // markup of Virtuoso's own list: an integrator's `components.List` may drop its test ID.
    const BareList = forwardRef<HTMLDivElement, ListProps>(function BareList(
      { children, style },
      ref,
    ) {
      return (
        <div className='bare-list' ref={ref} style={style}>
          {children}
        </div>
      );
    });
    await runScenario(
      'B-34-custom-list-positioning',
      { listProps: { additionalVirtuosoProps: { components: { List: BareList } } } },
      async ({ checkpoint, mounted, step }) => {
        expect(
          mounted.frame.querySelector('[data-testid="virtuoso-item-list"]'),
          'no test ID on the list',
        ).toBeNull();
        await wait(500);
        const mountedPoint = checkpoint('after 500ms');
        expect(
          mountedPoint.requests.filter((request) => request.messages?.id_lt),
        ).toEqual([]);
        const jump = await step('jump to an older message', () =>
          mounted.channel.messagePaginator.jumpToMessage('m-0060'),
        );
        // v2 can lose a jump to its remount race (see B-08): recorded for the comparison only.
        if (RUNTIME !== 'browser-v2') {
          expect(
            jump.requests.filter(
              (request) => request.messages?.id_gt || request.messages?.id_lt,
            ),
            'pages loaded while the jump was positioned',
          ).toEqual([]);
          const visible = readVisibleItems(mounted.frame).map((item) => item.id);
          expect(visible, 'the jumped-to message is in view').toContain('m-0060');
        }
      },
    );
  });

  it('B-35 shows the loading indicator while the list is hidden to be positioned, unless turned off', async () => {
    // Frame by frame from mount until the list shows: the indicator must be over the list on every
    // frame it is hidden (react-virtuoso 4 positioning it), and gone once it shows.
    const watchMount = async (showLoadingIndicatorWhilePositioning?: boolean) => {
      const mounted = await mountList({
        listProps:
          showLoadingIndicatorWhilePositioning === undefined
            ? undefined
            : { showLoadingIndicatorWhilePositioning },
        measureMount: false,
      });
      const counts = { hidden: 0, hiddenWithIndicator: 0, shownWithIndicator: 0 };
      for (let frames = 0; frames < 240; frames += 1) {
        const indicator = !!mounted.frame.querySelector(
          '.str-chat__virtual-list__positioning',
        );
        const busy = mounted.frame
          .querySelector('.str-chat__virtual-list')
          ?.getAttribute('aria-busy');
        if (!isListVisible(mounted.frame)) {
          counts.hidden += 1;
          if (indicator && busy === 'true') counts.hiddenWithIndicator += 1;
        } else if (readVisibleItems(mounted.frame).length) {
          if (indicator) counts.shownWithIndicator += 1;
          await settle(mounted.frame);
          if (mounted.frame.querySelector('.str-chat__virtual-list__positioning')) {
            counts.shownWithIndicator += 1;
          }
          break;
        }
        await nextFrame();
      }
      mounted.unmount();
      return counts;
    };

    const shown = await watchMount();
    const off = await watchMount(false);
    if (RUNTIME !== 'browser-v2') {
      expect(shown.hidden, 'frames hidden while positioned').toBeGreaterThan(0);
    }
    // The list reports itself hidden from its first commit, and the indicator renders in the next
    // one: the first frame after mount may still be without it.
    expect(
      shown.hiddenWithIndicator,
      'hidden frames with the indicator',
    ).toBeGreaterThanOrEqual(shown.hidden - 1);
    expect(shown.shownWithIndicator, 'indicator after the list shows').toBe(0);
    expect(off.hiddenWithIndicator, 'indicator when turned off').toBe(0);
    expect(off.shownWithIndicator, 'indicator when turned off').toBe(0);
  });

  it('B-25 releases everything after repeated mounting', async () => {
    const resources = trackResources();
    try {
      const baseline = resources.counts();
      for (let cycle = 0; cycle < 20; cycle += 1) {
        const mounted = await mountList({ measureMount: false, seed: 10 + cycle });
        await settle(mounted.frame);
        mounted.unmount();
      }
      await nextFrame();
      expect(resources.counts(), JSON.stringify(resources.pending(), null, 1)).toEqual(
        baseline,
      );
    } finally {
      resources.restore();
    }
  });
});
