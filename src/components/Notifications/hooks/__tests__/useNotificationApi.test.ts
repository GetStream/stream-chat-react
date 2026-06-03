import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { StateStore } from 'stream-chat';

import { useChatContext, useModalDialogManager } from '../../../../context';
import { modalDialogId } from '../../../Dialog';
import { useNotificationTarget } from '../useNotificationTarget';
import type { DialogManagerState } from '../../../Dialog/service/DialogManager';
import type { Notification } from 'stream-chat';

import {
  hasSystemNotificationTag,
  SYSTEM_NOTIFICATION_TAG,
  useNotificationApi,
} from '../useNotificationApi';

vi.mock('../../../../context', () => ({
  useChatContext: vi.fn(),
  useModalDialogManager: vi.fn(),
}));

vi.mock('../useNotificationTarget', () => ({
  useNotificationTarget: vi.fn(),
}));

const add = vi.fn();
const remove = vi.fn();
const startTimeout = vi.fn();

const mockedUseChatContext = vi.mocked(useChatContext);
const mockedUseModalDialogManager = vi.mocked(useModalDialogManager);
const mockedUseNotificationTarget = vi.mocked(useNotificationTarget);

const createModalDialogManager = (isOpen: boolean) =>
  fromPartial({
    state: new StateStore<DialogManagerState>({
      dialogsById: {
        [modalDialogId]: fromPartial({ isOpen }),
      },
    }),
  });

describe('useNotificationApi', () => {
  beforeEach(() => {
    mockedUseModalDialogManager.mockReturnValue(createModalDialogManager(false));
    mockedUseNotificationTarget.mockReturnValue(undefined);
    mockedUseChatContext.mockReturnValue(
      fromPartial({
        client: {
          notifications: {
            add,
            remove,
            startTimeout,
          },
        },
      }),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('removes notification by id', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.removeNotification('notification-id');

    expect(remove).toHaveBeenCalledWith('notification-id');
  });

  it('starts notification timeout by id', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.startNotificationTimeout('notification-id');

    expect(startTimeout).toHaveBeenCalledWith('notification-id');
  });

  it('does not add target panel tags when targetPanels and inferred panel are missing', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'MessageComposer',
      message: 'Send message request failed',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Send message request failed',
      options: {},
      origin: { emitter: 'MessageComposer' },
    });
  });

  it('adds inferred target panel tag when targetPanels is not provided', () => {
    mockedUseNotificationTarget.mockReturnValue('thread');

    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'MessageComposer',
      message: 'Send message request failed',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Send message request failed',
      options: { tags: ['target:thread'] },
      origin: { emitter: 'MessageComposer' },
    });
  });

  it('uses explicit target panels and ignores inferred panel tag', () => {
    mockedUseNotificationTarget.mockReturnValue('channel');

    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'ChannelListItemActionButtons',
      message: 'Failed to update channel mute status',
      severity: 'error',
      tags: ['custom-tag'],
      targetPanels: ['thread', 'channel-list'],
      type: 'api:channel:mute:failed',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Failed to update channel mute status',
      options: {
        severity: 'error',
        tags: ['target:thread', 'target:channel-list', 'custom-tag'],
        type: 'api:channel:mute:failed',
      },
      origin: { emitter: 'ChannelListItemActionButtons' },
    });
  });

  it('allows passing targetPanels as an empty array to skip target tags', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'Message',
      message: 'Skipped panel tag',
      targetPanels: [],
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Skipped panel tag',
      options: {},
      origin: { emitter: 'Message' },
    });
  });

  it('adds the modal target to explicit target panels while a modal is open', () => {
    mockedUseModalDialogManager.mockReturnValue(createModalDialogManager(true));

    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'Message',
      message: 'Channel notification above modal',
      targetPanels: ['channel'],
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Channel notification above modal',
      options: { tags: ['target:channel', 'target:modal'] },
      origin: { emitter: 'Message' },
    });
  });

  it('adds the modal target to inferred target panel while a modal is open', () => {
    mockedUseModalDialogManager.mockReturnValue(createModalDialogManager(true));
    mockedUseNotificationTarget.mockReturnValue('thread');

    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'MessageComposer',
      message: 'Inferred target above modal',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Inferred target above modal',
      options: { tags: ['target:thread', 'target:modal'] },
      origin: { emitter: 'MessageComposer' },
    });
  });

  it('preserves explicitly empty target panels while a modal is open', () => {
    mockedUseModalDialogManager.mockReturnValue(createModalDialogManager(true));

    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'Message',
      message: 'Skipped panel tag',
      targetPanels: [],
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Skipped panel tag',
      options: {},
      origin: { emitter: 'Message' },
    });
  });

  it('falls back to notifications.add for severities without dedicated helpers', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'NotificationPromptDialog',
      message: 'Heads up',
      severity: 'warning',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Heads up',
      options: { severity: 'warning' },
      origin: { emitter: 'NotificationPromptDialog' },
    });
  });

  it('passes explicit type as-is', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'MessageComposer',
      message: 'Edit message request failed',
      severity: 'error',
      type: 'api:message:edit:failed',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Edit message request failed',
      options: {
        severity: 'error',
        type: 'api:message:edit:failed',
      },
      origin: { emitter: 'MessageComposer' },
    });
  });

  it('constructs type from incident when type is not provided', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'ShareLocationDialog',
      incident: {
        domain: 'api',
        entity: 'location',
        operation: 'share',
      },
      message: 'Failed to share location',
      severity: 'error',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Failed to share location',
      options: {
        severity: 'error',
        type: 'api:location:share:failed',
      },
      origin: { emitter: 'ShareLocationDialog' },
    });
  });

  it('prefers explicit type over incident-derived type', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'ShareLocationDialog',
      incident: {
        domain: 'api',
        entity: 'location',
        operation: 'share',
      },
      message: 'Failed to share location',
      severity: 'error',
      type: 'custom:type',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Failed to share location',
      options: {
        severity: 'error',
        type: 'custom:type',
      },
      origin: { emitter: 'ShareLocationDialog' },
    });
  });

  it('uses incident.status when provided', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'ShareLocationDialog',
      incident: {
        domain: 'api',
        entity: 'location',
        operation: 'share',
        status: 'blocked',
      },
      message: 'Location sharing blocked',
      severity: 'error',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Location sharing blocked',
      options: {
        severity: 'error',
        type: 'api:location:share:blocked',
      },
      origin: { emitter: 'ShareLocationDialog' },
    });
  });

  it('falls back to severity as status for incident type when severity is non-error/success', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addNotification({
      emitter: 'Uploader',
      incident: {
        domain: 'api',
        entity: 'attachment',
        operation: 'upload',
      },
      message: 'Uploading attachment',
      severity: 'loading',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Uploading attachment',
      options: {
        severity: 'loading',
        type: 'api:attachment:upload:loading',
      },
      origin: { emitter: 'Uploader' },
    });
  });

  it('addSystemNotification applies system tag and skips panel target tags', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addSystemNotification({
      duration: 0,
      emitter: 'Chat',
      message: 'Waiting for network…',
      severity: 'loading',
      type: 'system:network:connection:lost',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Waiting for network…',
      options: {
        duration: 0,
        severity: 'loading',
        tags: ['system'],
        type: 'system:network:connection:lost',
      },
      origin: { emitter: 'Chat' },
    });
  });

  it('addSystemNotification merges extra tags with system tag', () => {
    const { result } = renderHook(() => useNotificationApi());

    result.current.addSystemNotification({
      emitter: 'App',
      message: 'Maintenance',
      severity: 'warning',
      tags: ['custom'],
      type: 'app:maintenance:upcoming',
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Maintenance',
      options: {
        severity: 'warning',
        tags: ['system', 'custom'],
        type: 'app:maintenance:upcoming',
      },
      origin: { emitter: 'App' },
    });
  });
});

describe('system notification tag helpers', () => {
  const base: Notification = {
    createdAt: 1,
    id: 'n1',
    message: 'x',
    origin: { emitter: 't' },
  };

  it('SYSTEM_NOTIFICATION_TAG is system', () => {
    expect(SYSTEM_NOTIFICATION_TAG).toBe('system');
  });

  it('hasSystemNotificationTag returns true when system tag is present', () => {
    expect(hasSystemNotificationTag({ ...base, tags: ['system'] })).toBe(true);
  });

  it('hasSystemNotificationTag returns false when tag is missing or different', () => {
    expect(hasSystemNotificationTag(base)).toBe(false);
    expect(hasSystemNotificationTag({ ...base, tags: ['channel'] })).toBe(false);
  });
});
