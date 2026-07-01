import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { StateStore } from 'stream-chat';

import { GlobalModal } from '../../../Modal';
import { useNotificationApi } from '../useNotificationApi';
import {
  ChatProvider,
  ComponentProvider,
  ModalDialogManagerProvider,
} from '../../../../context';
import { mockChatContext } from '../../../../mock-builders';

import type { NotificationManagerState } from 'stream-chat';

describe('useNotificationApi', () => {
  it('targets the modal panel when a generated-id GlobalModal is open', async () => {
    const add = vi.fn();
    const store = new StateStore<NotificationManagerState>({ notifications: [] });
    const client = {
      notifications: {
        add,
        store,
      },
    };

    const wrapper = ({ children }: React.PropsWithChildren) => (
      <ChatProvider value={mockChatContext({ client })}>
        <ComponentProvider value={{ NotificationList: () => null }}>
          <ModalDialogManagerProvider>
            <GlobalModal aria-label='Test modal' open>
              Modal content
            </GlobalModal>
            {children}
          </ModalDialogManagerProvider>
        </ComponentProvider>
      </ChatProvider>
    );

    const { result } = renderHook(() => useNotificationApi(), { wrapper });

    await waitFor(() => {
      result.current.addNotification({
        emitter: 'test',
        message: 'Failed',
        severity: 'error',
      });

      expect(add).toHaveBeenLastCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            tags: ['target:modal'],
          }),
        }),
      );
    });
  });
});
