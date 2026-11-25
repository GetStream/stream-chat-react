import React, { useEffect, useMemo } from 'react';
import type { UserResponse } from 'stream-chat';

import { useChatContext } from '../../context';
import { useDialogIsOpen, useDialogOnNearestManager } from '../Dialog';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { ScheduleCompositionDialog } from './ScheduleCompositionDialog';
import { getScheduleAgainDialogId, toCompositionPreview } from './utils';

export const ScheduleAgainDialog = () => {
  const { client } = useChatContext();
  const messageComposer = useMessageComposerController();

  const dialogId = getScheduleAgainDialogId(messageComposer);
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  const isOpen = useDialogIsOpen(dialogId, dialogManager?.id);

  const previewMessage = useMemo(
    () =>
      isOpen
        ? toCompositionPreview(
            messageComposer,
            (client.user ?? { id: client.userID ?? '' }) as UserResponse,
          )
        : undefined,
    [client, isOpen, messageComposer],
  );

  useEffect(() => () => dialogManager?.close(dialogId), [dialogId, dialogManager]);

  return (
    <ScheduleCompositionDialog onClose={dialog.close} previewMessage={previewMessage} />
  );
};
