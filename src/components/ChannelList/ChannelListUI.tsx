import React from 'react';
import type { PropsWithChildren } from 'react';
import type { APIErrorResponse, Channel, ErrorFromResponse } from 'stream-chat';

import { LoadingChannels } from '../Loading/LoadingChannels';
import { NullComponent } from '../UtilityComponents';
import { useComponentContext, useTranslationContext } from '../../context';

export type ChannelListUIProps = {
  /** Whether the channel query request returned an errored response */
  error: ErrorFromResponse<APIErrorResponse> | null;
  /** The channels currently loaded in the list, only defined if `sendChannelsToList` on `ChannelList` is true */
  loadedChannels?: Channel[];
  /** Whether the channels are currently loading */
  loading?: boolean;
  /** Local state hook that resets the currently loaded channels */
  setChannels?: React.Dispatch<React.SetStateAction<Channel[]>>;
};

/**
 * A preview list of channels, allowing you to select the channel you want to open
 */
export const ChannelListUI = (props: PropsWithChildren<ChannelListUIProps>) => {
  const { children, error = null, loading = false } = props;
  const { LoadingErrorIndicator = NullComponent, LoadingIndicator = LoadingChannels } =
    useComponentContext('ChannelListUI');
  const { t } = useTranslationContext('ChannelListUI');

  if (error) {
    return <LoadingErrorIndicator error={error} />;
  }

  return (
    <div className='str-chat__channel-list-inner'>
      <div
        aria-label={t('aria/Channel list')}
        className='str-chat__channel-list-inner__main'
        role='listbox'
      >
        {loading ? <LoadingIndicator /> : children}
      </div>
    </div>
  );
};
