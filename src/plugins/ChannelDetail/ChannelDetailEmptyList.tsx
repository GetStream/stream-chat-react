import { useComponentContext } from '../../context';
import { IconSearch as DefaultIconSearch } from '../../components/Icons';
import type { PropsWithChildrenOnly } from '../../types/types';

export const ChannelDetailEmptyList = ({ children }: PropsWithChildrenOnly) => {
  const { icons: { IconSearch = DefaultIconSearch } = {} } = useComponentContext();
  return (
    <div className='str-chat__channel-detail__channel-members-view__empty-state'>
      <IconSearch />
      <div>{children}</div>
    </div>
  );
};
