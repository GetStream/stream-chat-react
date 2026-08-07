import { useComponentContextIcons } from '../../context';
import type { PropsWithChildrenOnly } from '../../types/types';

export const ChannelDetailEmptyList = ({ children }: PropsWithChildrenOnly) => {
  const { IconSearch } = useComponentContextIcons();
  return (
    <div className='str-chat__channel-detail__channel-members-view__empty-state'>
      <IconSearch />
      <div>{children}</div>
    </div>
  );
};
