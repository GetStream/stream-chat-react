import React, { useRef, useState } from 'react';
import type { LocalMessage, MessageComposer, UserResponse } from 'stream-chat';

import {
  useChatContext,
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { Button } from '../Button';
import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuHeader,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from '../Dialog';
import { useMessageComposerHasSendableData } from '../MessageComposer/hooks';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { useChannelScheduledMessageLimit } from './hooks/useChannelScheduledMessageLimit';
import { useScheduleComposition } from './hooks/useScheduleComposition';
import { ScheduleCompositionDialog } from './ScheduleCompositionDialog';
import { getSchedulePresets, getScheduleTimeBounds, toCompositionPreview } from './utils';

const getScheduleMessageMenuId = ({ threadId }: Pick<MessageComposer, 'threadId'>) =>
  `schedule-message-menu${threadId ? '-thread' : ''}`;

const getScheduleMessageMenuHeaderId = (
  messageComposer: Pick<MessageComposer, 'threadId'>,
) => `${getScheduleMessageMenuId(messageComposer)}-header`;

const ScheduleMessageMenuHeader = () => {
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposerController();
  const { reachedLimit } = useChannelScheduledMessageLimit(messageComposer.channel);

  const title =
    reachedLimit !== undefined
      ? t('scheduledMessages.limitReachedMax', 'Limit reached ({{ max }} max)', {
          max: reachedLimit,
        })
      : t('scheduledMessages.scheduleMessage', 'Schedule message');

  return (
    <ContextMenuHeader
      className='str-chat__schedule-message-menu__header'
      id={getScheduleMessageMenuHeaderId(messageComposer)}
    >
      {title}
    </ContextMenuHeader>
  );
};

/**
 * The chevron next to the send button: schedules the composition at a preset time or opens a
 * dialog to pick one.
 */
export const ScheduleMessageButton = () => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { IconChevronUp, IconClock } = useComponentContextIcons();
  const { ContextMenu: ContextMenuComponent = ContextMenu } = useComponentContext();
  const messageComposer = useMessageComposerController();
  const { scheduleMessage } = useScheduleComposition();
  const hasSendableData = useMessageComposerHasSendableData();

  const { reachedLimit } = useChannelScheduledMessageLimit(messageComposer.channel);
  const isLimitReached = reachedLimit !== undefined;
  const menuId = getScheduleMessageMenuId(messageComposer);
  const limitReachedProps = isLimitReached
    ? {
        'aria-describedby': getScheduleMessageMenuHeaderId(messageComposer),
        'aria-disabled': true as const,
      }
    : undefined;
  const { dialog: menu, dialogManager } = useDialogOnNearestManager({ id: menuId });
  const isMenuOpen = useDialogIsOpen(menuId, dialogManager?.id);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dialogPreview, setDialogPreview] = useState<LocalMessage>();

  const openDialog = () => {
    menu.close();
    setDialogPreview(
      toCompositionPreview(
        messageComposer,
        (client.user ?? { id: client.userID ?? '' }) as UserResponse,
      ),
    );
  };

  const closeDialog = () => {
    setDialogPreview(undefined);
    // the menu item that opened the dialog is gone, so focus returns to the chevron
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  return (
    <>
      <Button
        appearance='solid'
        aria-expanded={isMenuOpen}
        aria-haspopup='menu'
        aria-label={t(
          'scheduledMessages.openScheduleMessageMenu.ariaLabel',
          'Open schedule message menu',
        )}
        circular
        className='str-chat__schedule-message-button'
        data-testid='schedule-message-button'
        disabled={!hasSendableData}
        onClick={() => menu.toggle()}
        ref={buttonRef}
        size='xs'
        variant='primary'
      >
        <IconChevronUp />
      </Button>
      <ContextMenuComponent
        allowFlip
        aria-label={t('scheduledMessages.scheduleMessage', 'Schedule message')}
        className='str-chat__schedule-message-menu'
        data-testid='schedule-message-menu'
        dialogManagerId={dialogManager?.id}
        Header={ScheduleMessageMenuHeader}
        id={menuId}
        onClose={menu.close}
        placement='top-end'
        // aligned with the whole split send button, not the chevron inset in it
        referenceElement={
          buttonRef.current?.closest<HTMLElement>('.str-chat__split-send-button') ??
          buttonRef.current
        }
        tabIndex={-1}
      >
        {isMenuOpen &&
          getSchedulePresets(
            new Date(),
            getScheduleTimeBounds(messageComposer.channel),
          ).map((scheduledAt) => (
            <ContextMenuButton
              className='str-chat__schedule-message-menu__preset'
              Icon={IconClock}
              key={scheduledAt.getTime()}
              {...limitReachedProps}
              onClick={() => {
                if (isLimitReached) return;
                menu.close();
                scheduleMessage(scheduledAt).catch(() => undefined);
              }}
            >
              {t('timestamp.SchedulePreset', { timestamp: scheduledAt })}
            </ContextMenuButton>
          ))}
        <div className='str-chat__context-menu__separator' role='separator' />
        <ContextMenuButton
          aria-haspopup='dialog'
          className='str-chat__schedule-message-menu__custom-time'
          hasSubMenu
          Icon={IconClock}
          {...limitReachedProps}
          onClick={() => {
            if (!isLimitReached) openDialog();
          }}
        >
          {t('scheduledMessages.customTime', 'Custom time')}
        </ContextMenuButton>
      </ContextMenuComponent>
      <ScheduleCompositionDialog onClose={closeDialog} previewMessage={dialogPreview} />
    </>
  );
};
