import {
  getNotificationTargetPanel,
  getNotificationTargetPanels,
  isNotificationForPanel,
  isNotificationTargetPanel,
} from '../notificationTarget';

import type { Notification } from 'stream-chat';

const notification = (panel?: unknown) =>
  ({
    createdAt: Date.now(),
    id: 'n1',
    message: 'test',
    origin: {
      context: panel === undefined ? {} : { panel },
      emitter: 'test',
    },
    severity: 'info',
  }) as Notification;

const taggedNotification = (tag: string) =>
  ({
    createdAt: Date.now(),
    id: 'n2',
    message: 'test',
    origin: {
      context: {},
      emitter: 'test',
    },
    severity: 'info',
    tags: [tag],
  }) as Notification;

const multiTaggedNotification = (tags: string[]) =>
  ({
    createdAt: Date.now(),
    id: 'n3',
    message: 'test',
    origin: {
      context: {},
      emitter: 'test',
    },
    severity: 'info',
    tags,
  }) as Notification;

const composerNotification = (contextType?: unknown) =>
  ({
    createdAt: Date.now(),
    id: 'n1',
    message: 'test',
    origin: {
      // `stream-chat` puts the composer that raised an upload notification here; see
      // `AttachmentManager` and the attachment upload middleware.
      context: { composer: { contextType } },
      emitter: 'AttachmentManager',
    },
    severity: 'error',
  }) as Notification;

describe('notificationOrigin helpers', () => {
  it('recognizes supported panel values', () => {
    expect(isNotificationTargetPanel('channel')).toBe(true);
    expect(isNotificationTargetPanel('thread')).toBe(true);
    expect(isNotificationTargetPanel('channel-list')).toBe(true);
    expect(isNotificationTargetPanel('thread-list')).toBe(true);
    expect(isNotificationTargetPanel('modal')).toBe(true);
    expect(isNotificationTargetPanel('unknown')).toBe(false);
  });

  it('extracts panel from notification origin context', () => {
    expect(getNotificationTargetPanel(notification('thread-list'))).toBe('thread-list');
    expect(getNotificationTargetPanel(notification('invalid-panel'))).toBeUndefined();
  });

  it('extracts panel from target tag when present', () => {
    expect(getNotificationTargetPanel(taggedNotification('target:channel-list'))).toBe(
      'channel-list',
    );
  });

  it('extracts all supported target panels from tags when present', () => {
    expect(
      getNotificationTargetPanels(
        multiTaggedNotification(['target:thread', 'target:channel-list', 'ignored']),
      ),
    ).toEqual(['thread', 'channel-list']);
  });

  it('falls back to channel panel when panel is missing', () => {
    expect(isNotificationForPanel(notification(), 'channel')).toBe(true);
    expect(isNotificationForPanel(notification(), 'thread')).toBe(false);
  });

  it('supports overriding the fallback panel', () => {
    expect(
      isNotificationForPanel(notification(), 'thread-list', {
        fallbackPanel: 'thread-list',
      }),
    ).toBe(true);
    expect(
      isNotificationForPanel(notification(), 'modal', {
        fallbackPanel: 'modal',
      }),
    ).toBe(true);
    expect(
      isNotificationForPanel(notification(), 'channel', {
        fallbackPanel: 'thread-list',
      }),
    ).toBe(false);
  });

  it('matches explicit target panel when present', () => {
    expect(isNotificationForPanel(notification('thread'), 'thread')).toBe(true);
    expect(isNotificationForPanel(notification('thread'), 'channel')).toBe(false);
  });

  it('matches notification for any explicitly tagged target panel', () => {
    const notificationWithMultipleTargets = multiTaggedNotification([
      'target:thread',
      'target:channel-list',
    ]);

    expect(isNotificationForPanel(notificationWithMultipleTargets, 'thread')).toBe(true);
    expect(isNotificationForPanel(notificationWithMultipleTargets, 'channel-list')).toBe(
      true,
    );
    expect(isNotificationForPanel(notificationWithMultipleTargets, 'channel')).toBe(
      false,
    );
  });
});

describe('the panel implied by the raising composer', () => {
  it('routes a thread composer to the thread panel', () => {
    expect(getNotificationTargetPanel(composerNotification('thread'))).toBe('thread');
    expect(getNotificationTargetPanels(composerNotification('thread'))).toEqual([
      'thread',
    ]);
  });

  it('routes a channel composer to the channel panel', () => {
    expect(getNotificationTargetPanel(composerNotification('channel'))).toBe('channel');
  });

  it('implies no panel for a composition context that has none', () => {
    // `message` and `legacy_thread` are composition contexts without a surface of their own.
    expect(getNotificationTargetPanel(composerNotification('message'))).toBeUndefined();
    expect(getNotificationTargetPanel(composerNotification(undefined))).toBeUndefined();
    expect(getNotificationTargetPanels(composerNotification('message'))).toEqual([]);
  });

  it('is outranked by an explicit target', () => {
    const explicit = {
      ...composerNotification('thread'),
      tags: ['target:channel'],
    } as Notification;

    expect(getNotificationTargetPanel(explicit)).toBe('channel');
  });

  it('makes a composer-raised notification targeted, so it ignores a fallback panel', () => {
    // Worth pinning: before the composer was carried, this notification was untargeted and any
    // list claimed it through its `fallbackPanel`. It now belongs to one panel.
    const raisedInThread = composerNotification('thread');

    expect(isNotificationForPanel(raisedInThread, 'thread')).toBe(true);
    expect(
      isNotificationForPanel(raisedInThread, 'channel', { fallbackPanel: 'channel' }),
    ).toBe(false);
  });
});
