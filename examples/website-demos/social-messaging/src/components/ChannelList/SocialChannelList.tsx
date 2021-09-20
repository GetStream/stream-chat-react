import React from 'react';

import type { ChannelListMessengerProps } from 'stream-chat-react';

import { SocialChannelListHeader } from './SocialChannelListHeader';
import { SocialChannelListFooter } from './SocialChannelListFooter';
import { useViewContext } from '../../contexts/ViewContext';
import { LoadingWireframe } from '../LoadingWireframe/LoadingWireframe';
import { NewChatPreview } from '../NewChat/NewChatPreview';
import { SocialChannelSearch } from '../ChannelSearch/SocialChannelSearch';

import './SocialChannelList.scss';

const ConnectionError = () => (
  <div className='connection-error'>
    <span>Waiting for Network</span>
  </div>
);

export const SocialChannelList: React.FC<ChannelListMessengerProps> = (props) => {
  const { children, error } = props;

  const ListWrapper: React.FC<ChannelListMessengerProps> = (props) => {
    const { children, error, loading } = props;

    const { isNewChat } = useViewContext();

    if (error) {
      return (
        <div className='channel-list'>
          <ConnectionError />
          <LoadingWireframe />
        </div>
      );
    }

    if (loading) {
      return (
        <div className='channel-list'>
          <LoadingWireframe />
        </div>
      );
    }

    return (
      <div className='channel-list'>
        {error && <ConnectionError />}
        <SocialChannelSearch />
        {isNewChat && <NewChatPreview />}
        {children}
      </div>
    );
  };

  return (
    <>
      <SocialChannelListHeader error={error} />
      <ListWrapper>{children}</ListWrapper>
      <SocialChannelListFooter />
    </>
  );
};
