import { IconPin } from '../../../../components/Icons';
import { useTranslationContext } from '../../../../context';

export const PinnedMessagesEmptyList = () => {
  const { t } = useTranslationContext();

  return (
    <div className='str-chat__channel-detail__pinned-messages-view__empty-state'>
      <IconPin className='str-chat__channel-detail__pinned-messages-view__empty-state__icon' />
      <div className='str-chat__channel-detail__pinned-messages-view__empty-state__content'>
        <p className='str-chat__channel-detail__pinned-messages-view__empty-state__title'>
          {t('No pinned messages')}
        </p>
        <p className='str-chat__channel-detail__pinned-messages-view__empty-state__description'>
          {t('Pin a message to see it here')}
        </p>
      </div>
    </div>
  );
};
