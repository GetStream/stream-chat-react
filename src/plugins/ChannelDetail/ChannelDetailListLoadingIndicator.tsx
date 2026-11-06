import type { SearchSource, SearchSourceState } from 'stream-chat';
import { useStateStore } from '../../store';
import { LoadingIndicator as DefaultLoadingIndicator } from '../../components/Loading';
import { useComponentContext } from '../../context';

const searchSourceFooterStateSelector = (state: SearchSourceState) => ({
  hasNextPage: state.hasNext,
  isLoading: state.isLoading,
});

export type ChannelMembersViewListFooterProps<T> = {
  searchSource: SearchSource<T>;
};

export const ChannelDetailListLoadingIndicator = <T,>({
  searchSource,
}: ChannelMembersViewListFooterProps<T>) => {
  const { LoadingIndicator = DefaultLoadingIndicator } = useComponentContext();
  const { hasNextPage, isLoading } = useStateStore(
    searchSource.state,
    searchSourceFooterStateSelector,
  );

  if (!hasNextPage || !isLoading) return null;

  return (
    <div className='str-chat__loading-indicator-placeholder'>
      {isLoading && <LoadingIndicator />}
    </div>
  );
};
