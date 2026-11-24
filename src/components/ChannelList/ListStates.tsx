import React from 'react';

import {
  ListEndReachedUI as DefaultListEndReachedUI,
  type ListEndReachedUIProps,
  type ListLoadErrorUIProps,
  type ListLoadingNextPageUIProps,
  ListLoadErrorUI as SharedListLoadErrorUI,
} from '../ListStates';
import { renderWithDeprecatedKey } from '../ListStates/utils';
import { LoadingChannels, LoadingIndicator } from '../Loading';
import { useComponentContext } from '../../context/ComponentContext';
import { useComponentContextIcons } from '../../context/useComponentContextIcons';
import { useTranslationContext } from '../../context/TranslationContext';

// The channel list's list states: the `ChannelList<State>UI` components the list renders, and the
// list's own `ChannelList<State>` defaults. Each `…UI` component renders the deprecated channel
// list key for its state while set, else the shared `List<State>UI` key, else the default.

/** While the first page loads: `ListFirstPageLoadingUI`, or the channel skeleton. */
export const ChannelListFirstPageLoadingUI = () => {
  const { FirstPageLoadingIndicator, ListFirstPageLoadingUI = LoadingChannels } =
    useComponentContext();
  return renderWithDeprecatedKey(
    FirstPageLoadingIndicator,
    {},
    <ListFirstPageLoadingUI />,
  );
};

/** The channel list's empty state: an icon and "No conversations yet". */
export const ChannelListEmpty = () => {
  const { t } = useTranslationContext();
  const { IconMessageBubbles } = useComponentContextIcons();
  return (
    <div className='str-chat__channel-list-empty'>
      <IconMessageBubbles />
      <p role='listitem'>
        {t('emptyState.indicator.noConversationsYet.label', 'No conversations yet')}
      </p>
    </div>
  );
};

/** A loaded list without channels: `ListEmptyUI`, or the channel empty state. */
export const ChannelListEmptyUI = () => {
  const { EmptyListIndicator, ListEmptyUI = ChannelListEmpty } = useComponentContext();
  return renderWithDeprecatedKey(EmptyListIndicator, {}, <ListEmptyUI />);
};

/**
 * The channel list's own next-page loading state: the SDK's spinner, centered below the channels,
 * while `isLoading`. It does not read the `LoadingIndicator` key.
 */
const ChannelListLoadingNextPage = ({ isLoading }: ListLoadingNextPageUIProps) =>
  isLoading ? (
    <div className='str-chat__channel-list__loading'>
      <LoadingIndicator />
    </div>
  ) : null;

/** Below the channels while the next page loads: `ListLoadingNextPageUI`. */
export const ChannelListLoadingNextPageUI = (props: ListLoadingNextPageUIProps) => {
  const { ListLoadingNextPageUI = ChannelListLoadingNextPage, LoadingNextPageIndicator } =
    useComponentContext();
  return renderWithDeprecatedKey(
    LoadingNextPageIndicator,
    props,
    <ListLoadingNextPageUI {...props} />,
  );
};

/** At the edges of the list: `ListEndReachedUI`, which renders nothing by default. */
export const ChannelListEndReachedUI = (props: ListEndReachedUIProps) => {
  const { EndReachedIndicator, ListEndReachedUI = DefaultListEndReachedUI } =
    useComponentContext();
  return renderWithDeprecatedKey(
    EndReachedIndicator,
    props,
    <ListEndReachedUI {...props} />,
  );
};

const ChannelListLoadErrorTitle = () => {
  const { t } = useTranslationContext();
  return <>{t('channelList.loadError.text', "Couldn't load conversations")}</>;
};

/** The channel list's error in place of a failed first page: "Couldn't load conversations". */
export const ChannelListLoadError = (props: ListLoadErrorUIProps) => (
  <SharedListLoadErrorUI
    {...props}
    className='str-chat__channel-list-load-error'
    Title={ChannelListLoadErrorTitle}
  />
);

/**
 * In place of a failed first page: the deprecated `ListLoadErrorIndicator` key while set, else
 * `ListLoadErrorUI`, or "Couldn't load conversations".
 */
export const ChannelListLoadErrorUI = (props: ListLoadErrorUIProps) => {
  const { ListLoadErrorIndicator, ListLoadErrorUI = ChannelListLoadError } =
    useComponentContext();
  return renderWithDeprecatedKey(
    ListLoadErrorIndicator,
    props,
    <ListLoadErrorUI {...props} />,
  );
};
