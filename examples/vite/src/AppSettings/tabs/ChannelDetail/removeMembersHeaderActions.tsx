import {
  Button,
  ContextMenuButton,
  IconUserRemove,
  useTranslationContext,
} from 'stream-chat-react';
import type { ChannelMembersHeaderActionComponentProps } from 'stream-chat-react/channel-detail';

// Bulk member removal is an application-level feature in this demo. The SDK only
// provides the injectable `remove` mode + header-action machinery; the actions
// that switch into that mode live here, in app space.

export const RemoveMembersHeaderAction = ({
  modeController,
}: ChannelMembersHeaderActionComponentProps) => {
  const { t } = useTranslationContext();

  if (modeController.mode !== 'browse') return null;

  return (
    <Button
      appearance='outline'
      aria-label={t('Remove channel members')}
      className='str-chat__channel-detail__channel-members-view__remove-button'
      onClick={() => modeController.setMode('remove')}
      size='md'
      variant='secondary'
    >
      {t('Remove')}
    </Button>
  );
};

export const RemoveMembersMenuAction = ({
  closeMenu,
  modeController,
}: ChannelMembersHeaderActionComponentProps) => {
  const { t } = useTranslationContext();

  if (modeController.mode !== 'browse') return null;

  return (
    <ContextMenuButton
      aria-label={t('Remove channel members')}
      Icon={IconUserRemove}
      onClick={() => {
        modeController.setMode('remove');
        closeMenu?.();
      }}
    >
      {t('Remove')}
    </ContextMenuButton>
  );
};
