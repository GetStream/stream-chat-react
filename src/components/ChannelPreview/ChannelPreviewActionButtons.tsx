import React from 'react';
import type { Channel } from 'stream-chat';

import { useChannelMembershipState } from '../ChannelList';
import { useTranslationContext } from '../../context';
import { Button } from '../Button';
import { IconArchive, IconDotGrid1x3Horizontal, IconMute, IconPin } from '../Icons';

import clsx from 'clsx';
import { useIsChannelMuted } from './hooks/useIsChannelMuted';
import {
  ContextMenu,
  ContextMenuButton,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from '../Dialog';

export type ChannelPreviewActionButtonsProps = {
  channel: Channel;
};

export function ChannelPreviewActionButtons({
  channel,
}: ChannelPreviewActionButtonsProps) {
  const membership = useChannelMembershipState(channel);
  const { t } = useTranslationContext();
  const { muted: isMuted } = useIsChannelMuted(channel);

  const isDirectMessageChannel =
    channel.type === 'messaging' &&
    channel.data?.member_count === 2 &&
    channel.id?.startsWith('!members-');

  const [referenceElement, setReferenceElement] =
    React.useState<HTMLButtonElement | null>(null);
  const dialogId = `channel-action-buttons-${channel.id}`;
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  const dialogIsOpen = useDialogIsOpen(dialogId, dialogManager?.id);

  return (
    <div
      className={clsx('str-chat__channel-preview__action-buttons', {
        'str-chat__channel-preview__action-buttons--active': dialogIsOpen,
      })}
    >
      <Button
        appearance='ghost'
        aria-expanded={dialogIsOpen}
        aria-pressed={dialogIsOpen}
        circular
        onClick={(e) => {
          e.stopPropagation();

          dialog.toggle();
        }}
        ref={setReferenceElement}
        size='sm'
        variant='secondary'
      >
        <IconDotGrid1x3Horizontal />
      </Button>
      {isDirectMessageChannel ? (
        <Button
          appearance='ghost'
          aria-label={membership.archived_at ? t('Unarchive') : t('Archive')}
          aria-pressed={typeof membership.archived_at === 'string'}
          circular
          onClick={(e) => {
            e.stopPropagation();
            if (membership.archived_at) {
              channel.unarchive();
            } else {
              channel.archive();
            }
          }}
          size='sm'
          title={membership.archived_at ? t('Unarchive') : t('Archive')}
          variant='secondary'
        >
          <IconArchive />
        </Button>
      ) : (
        <Button
          appearance='ghost'
          aria-label={isMuted ? t('Unmute') : t('Mute')}
          aria-pressed={isMuted}
          circular
          onClick={(e) => {
            e.stopPropagation();
            if (isMuted) {
              channel.unmute();
            } else {
              channel.mute();
            }
          }}
          size='sm'
          title={isMuted ? t('Unmute') : t('Mute')}
          variant='secondary'
        >
          <IconMute />
        </Button>
      )}

      {/* TODO: clean this mess up (make ContextMenu accept children) */}
      <ContextMenu
        className='str-chat__channel-preview__action-buttons-context-menu'
        dialogManagerId={dialogManager?.id}
        id={dialog.id}
        items={[
          () => (
            <ContextMenuButton
              aria-label={membership.pinned_at ? t('Unpin') : t('Pin')}
              Icon={IconPin}
              key='pin-button'
              onClick={(e) => {
                e.stopPropagation();
                if (membership.pinned_at) {
                  channel.unpin();
                } else {
                  channel.pin();
                }
                dialog?.close();
              }}
              title={membership.pinned_at ? t('Unpin') : t('Pin')}
            >
              {membership.pinned_at ? t('Unpin') : t('Pin')}
            </ContextMenuButton>
          ),
          () => (
            <ContextMenuButton
              aria-label={isMuted ? t('Unmute') : t('Mute')}
              Icon={IconMute}
              key='mute-button'
              onClick={(e) => {
                e.stopPropagation();
                if (isMuted) {
                  channel.unmute();
                } else {
                  channel.mute();
                }
              }}
              title={isMuted ? t('Unmute') : t('Mute')}
            >
              {isMuted ? t('Unmute') : t('Mute')}
            </ContextMenuButton>
          ),
          () => (
            <ContextMenuButton
              aria-label={membership.archived_at ? t('Unarchive') : t('Archive')}
              Icon={IconArchive}
              key='archive-button'
              onClick={(e) => {
                e.stopPropagation();
                if (membership.archived_at) {
                  channel.unarchive();
                } else {
                  channel.archive();
                }
              }}
              title={membership.archived_at ? t('Unarchive') : t('Archive')}
            >
              {membership.archived_at ? t('Unarchive') : t('Archive')}
            </ContextMenuButton>
          ),
        ]}
        onClose={dialog?.close}
        placement='bottom-start'
        referenceElement={referenceElement}
        tabIndex={-1}
        trapFocus
      />
    </div>
  );
}
