import React from 'react';

// import type { Channel } from 'stream-chat';
import { ChannelListMessengerProps } from 'stream-chat-react';

import { SocialChannelListFooter } from '../../components/SocialChannelList/SocialChannelListFooter';
// import { SocialChannelPreview } from '../../components/ChannelPreview/SocialChannelPreview';

// import { useViewContext } from '../../contexts/ViewContext';

import './SocialChannelList.scss';

type Props = ChannelListMessengerProps;

// const user = process.env.REACT_APP_USER_ID;

export const SocialChannelList: React.FC<Props> = (props) => {
  const { children } = props;

  // const NewChannelList: React.FC = () => {

  //   const customFn = (channels: Channel[]) => {
  //     return channels;
  //   }

  //   const filters = { type: 'messaging', members: { $in: [user!] } };
    
  //   return (
  //     <ChannelList 
  //       channelRenderFilterFn={customFn}
  //       filters={filters}
  //       Preview={SocialChannelPreview}
  //     />
  //   )
  // }

  const ListHeaderWrapper: React.FC<Props> = (props) => {
    const { children } = props;
    
    // const { isListMentions } = useViewContext();

    return (
      <>
        <div className='channel-list'>
          {children}
        </div>
        <SocialChannelListFooter />
      </>
    );
  };

  return (
    <ListHeaderWrapper>{children}</ListHeaderWrapper>
  );
};

