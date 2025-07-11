import React from 'react';
import type { PropsWithChildren } from 'react';
import type { APIErrorResponse, Channel, ErrorFromResponse } from 'stream-chat';

import { LoadingChannels } from '../Loading/LoadingChannels';
import { NullComponent } from '../UtilityComponents';
import { useTranslationContext } from '../../context';
import type { LoadingErrorIndicatorProps } from '../Loading';

export type ChannelListMessengerProps = {
  /** Whether the channel query request returned an errored response */
  error: ErrorFromResponse<APIErrorResponse> | null;
  /** The channels currently loaded in the list, only defined if `sendChannelsToList` on `ChannelList` is true */
  loadedChannels?: Channel[];
  /** Whether the channels are currently loading */
  loading?: boolean;
  /** Custom UI component to display the loading error indicator, defaults to component that renders null */
  LoadingErrorIndicator?: React.ComponentType<LoadingErrorIndicatorProps>;
  /** Custom UI component to display a loading indicator, defaults to and accepts same props as: [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingChannels.tsx) */
  LoadingIndicator?: React.ComponentType;
  /** Local state hook that resets the currently loaded channels */
  setChannels?: React.Dispatch<React.SetStateAction<Channel[]>>;
};

/**
 * A preview list of channels, allowing you to select the channel you want to open
 */
export const ChannelListMessenger = (
  props: PropsWithChildren<ChannelListMessengerProps>,
) => {
  const {
    children,
    error = null,
    loading,
    LoadingErrorIndicator = NullComponent,
    LoadingIndicator = LoadingChannels,
  } = props;
  const { t } = useTranslationContext('ChannelListMessenger');

  if (error) {
    return <LoadingErrorIndicator error={error} />;
  }

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className='str-chat__channel-list-messenger str-chat__channel-list-messenger-react'>
      <div
        aria-label={t('aria/Channel list')}
        className='str-chat__channel-list-messenger__main str-chat__channel-list-messenger-react__main'
        role='listbox'
      >
        {children}
      </div>
    </div>
  );
};
