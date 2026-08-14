import { useTranslationContext } from '../../../../context';
import { IconFolder } from '../../../../components/Icons';

export const ChannelFilesEmptyList = () => {
  const { t } = useTranslationContext('ChannelFilesEmptyList');

  return (
    <div className='str-chat__channel-detail__files-view__empty-state'>
      <IconFolder className='str-chat__channel-detail__files-view__empty-state__icon' />
      <div className='str-chat__channel-detail__files-view__empty-state__content'>
        <p className='str-chat__channel-detail__files-view__empty-state__title'>
          {t('channelDetail.channelFilesEmpty.noFiles.text', 'No files')}
        </p>
        <p className='str-chat__channel-detail__files-view__empty-state__description'>
          {t(
            'channelDetail.channelFilesEmpty.shareFileSee.text',
            'Share a file to see it here',
          )}
        </p>
      </div>
    </div>
  );
};
