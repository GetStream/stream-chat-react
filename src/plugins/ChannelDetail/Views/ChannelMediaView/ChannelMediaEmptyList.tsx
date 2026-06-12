import { useTranslationContext } from '../../../../context';
import { IconImage } from '../../../../components/Icons';

export const ChannelMediaEmptyList = () => {
  const { t } = useTranslationContext('ChannelMediaEmptyList');

  return (
    <div className='str-chat__channel-detail__media-view__empty-state'>
      <IconImage className='str-chat__channel-detail__media-view__empty-state__icon' />
      <div className='str-chat__channel-detail__media-view__empty-state__content'>
        <p className='str-chat__channel-detail__media-view__empty-state__title'>
          {t('No photos or videos')}
        </p>
        <p className='str-chat__channel-detail__media-view__empty-state__description'>
          {t('Share a photo or video to see it here')}
        </p>
      </div>
    </div>
  );
};
