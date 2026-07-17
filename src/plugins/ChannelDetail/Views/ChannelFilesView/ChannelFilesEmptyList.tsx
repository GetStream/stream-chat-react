import { useComponentContext, useTranslationContext } from '../../../../context';
import { IconFolder as DefaultIconFolder } from '../../../../components/Icons';

export const ChannelFilesEmptyList = () => {
  const { icons: { IconFolder = DefaultIconFolder } = {} } = useComponentContext();

  const { t } = useTranslationContext('ChannelFilesEmptyList');

  return (
    <div className='str-chat__channel-detail__files-view__empty-state'>
      <IconFolder className='str-chat__channel-detail__files-view__empty-state__icon' />
      <div className='str-chat__channel-detail__files-view__empty-state__content'>
        <p className='str-chat__channel-detail__files-view__empty-state__title'>
          {t('No files')}
        </p>
        <p className='str-chat__channel-detail__files-view__empty-state__description'>
          {t('Share a file to see it here')}
        </p>
      </div>
    </div>
  );
};
