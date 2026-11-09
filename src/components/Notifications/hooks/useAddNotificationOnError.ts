import { useEffect, useRef } from 'react';

import { useStableCallback } from '../../../utils/useStableCallback';
import type { AddNotificationParams } from './useNotificationApi';
import { useNotificationApi } from './useNotificationApi';

/** Notification params of {@link useAddNotificationOnError}; the error and the `error` severity are its own. */
export type AddNotificationOnErrorParams = Omit<
  AddNotificationParams,
  'error' | 'severity'
>;

/**
 * Publishes an error notification each time `error` changes to a new error object while the
 * component is mounted. The error present on mount is not published: the hook reports only errors
 * that occur while it is mounted.
 *
 * @param error - The error to report; `undefined` while there is none.
 * @param params - The notification to publish for it, as for `addNotification`.
 */
export const useAddNotificationOnError = (
  error: Error | undefined,
  params: AddNotificationOnErrorParams,
) => {
  const { addNotification } = useNotificationApi();
  const errorOnMount = useRef(error);

  // The notification API and the params change with unrelated state (an open dialog, the
  // language), which must not publish the same error again.
  const addErrorNotification = useStableCallback((nextError: Error) =>
    addNotification({ ...params, error: nextError, severity: 'error' }),
  );

  useEffect(() => {
    if (error && error !== errorOnMount.current) addErrorNotification(error);
  }, [error, addErrorNotification]);
};
