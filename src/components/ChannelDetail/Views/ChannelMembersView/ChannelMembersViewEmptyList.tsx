import { IconSearch } from '../../../Icons';
import { useTranslationContext } from '../../../../context';

export const ChannelMembersViewEmptyList = () => {
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__channel-detail__channel-members-view__empty-state'>
      <IconSearch />
      <span>{t('No user found')}</span>
    </div>
  );
};
