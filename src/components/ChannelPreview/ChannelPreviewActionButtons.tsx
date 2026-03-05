import React from 'react';
import type { Channel } from 'stream-chat';

import { useChannelMembershipState } from '../ChannelList';
import { useTranslationContext } from '../../context';
import { Button } from '../Button';
import { IconArchive, IconMute, IconPin } from '../Icons';

import clsx from 'clsx';
import { useIsChannelMuted } from './hooks/useIsChannelMuted';

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

  // const buttonRef = useRef<ComponentRef<'button'>>(null);
  // const dialogId = `channel-action-buttons-${channel.id}`;
  // const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  // const dialogIsOpen = useDialogIsOpen(dialogId, dialogManager?.id);

  return (
    <div
      className={clsx('str-chat__channel-preview__action-buttons', {
        'str-chat__channel-preview__action-buttons--active': false, // dialogIsOpen,
      })}
    >
      <Button
        appearance='ghost'
        aria-label={membership.pinned_at ? t('Unpin') : t('Pin')}
        aria-pressed={typeof membership.pinned_at === 'string'}
        // aria-expanded={dialogIsOpen}
        // aria-pressed={dialogIsOpen}
        circular
        // onClick={() => dialog.toggle()}
        // ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          if (membership.pinned_at) {
            channel.unpin();
          } else {
            channel.pin();
          }
        }}
        size='sm'
        title={membership.pinned_at ? t('Unpin') : t('Pin')}
        variant='secondary'
      >
        {/* <IconDotGrid1x3Horizontal /> */}
        <IconPin />
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

      {/* <ContextMenu
        dialogManagerId={dialogManager?.id}
        id={dialog.id}
        items={[
          () => (
            <ContextMenuButton
              aria-label={membership.pinned_at ? t('Unpin') : t('Pin')}
              key='pin-button'
              onClick={(e) => {
                e.stopPropagation();
                if (membership.pinned_at) {
                  channel.unpin();
                } else {
                  channel.pin();
                }
              }}
              title={membership.pinned_at ? t('Unpin') : t('Pin')}
            >
              {membership.pinned_at ? t('Unpin') : t('Pin')}
            </ContextMenuButton>
          ),
        ]}
        onClose={dialog?.close}
        placement={'bottom-end'}
        referenceElement={buttonRef.current}
        tabIndex={-1}
        trapFocus
      /> */}
    </div>
  );
}
