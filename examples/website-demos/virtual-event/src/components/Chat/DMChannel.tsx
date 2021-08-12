import React, { useState } from 'react';
import { Channel as StreamChannel } from 'stream-chat';
import { Channel } from 'stream-chat-react';

import { ChannelInner } from './ChannelInner';
import { EmptyStateIndicators } from './EmptyStateIndicators';
import { GiphyPreview } from './GiphyPreview';
import { MessageUI } from './MessageUI';
import { MessageInputUI } from './MessageInputUI';
import { SuggestionHeader, SuggestionListItem } from './SuggestionList';
import { ThreadHeader } from './ThreadHeader';
import { UserActionsDropdown } from './UserActionsDropdown';

import { CloseX, Ellipse } from '../../assets';

type Props = {
  dmChannel: StreamChannel;
  setDmChannel: React.Dispatch<React.SetStateAction<StreamChannel | undefined>>;
};

export const DMChannel: React.FC<Props> = (props) => {
  const { dmChannel, setDmChannel } = props;

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const user = dmChannel.state.membership.user?.id;

  const channelTitle = Object.keys(dmChannel.state.members).filter((key) => key !== user);

  return (
    <div className='dm-channel'>
      <div className='dm-header-container'>
        <div className='dm-header-close' onClick={() => setDmChannel(undefined)}>
          <CloseX />
        </div>
        <div className='dm-header-title'>
          <div>{channelTitle}</div>
          <div className='dm-header-title-sub-title'>Direct Message</div>
        </div>
        <div
          className={`dm-header-actions ${dropdownOpen ? 'open' : ''}`}
          onClick={() => setDropdownOpen((prev) => !prev)}
        >
          <Ellipse />
        </div>
      </div>
      {dropdownOpen && (
        <UserActionsDropdown
          dropdownOpen={dropdownOpen}
          dmChannel={dmChannel}
          setDropdownOpen={setDropdownOpen}
        />
      )}
      <Channel
        AutocompleteSuggestionHeader={SuggestionHeader}
        AutocompleteSuggestionItem={SuggestionListItem}
        channel={dmChannel}
        EmptyStateIndicator={(props) => <EmptyStateIndicators {...props} isDmChannel />}
        GiphyPreviewMessage={GiphyPreview}
        Input={MessageInputUI}
        ThreadHeader={ThreadHeader}
        VirtualMessage={MessageUI}
      >
        <ChannelInner />
      </Channel>
    </div>
  );
};
