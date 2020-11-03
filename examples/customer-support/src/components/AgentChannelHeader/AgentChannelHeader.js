import React, { useContext } from 'react';
import { ChatContext } from 'stream-chat-react';

import './AgentChannelHeader.css';

import { DownIconSmall } from '../../assets/DownIconSmall';
import { EmailIcon } from '../../assets/EmailIcon';
import { PhoneIcon } from '../../assets/PhoneIcon';

export const AgentChannelHeader = () => {
  const { channel } = useContext(ChatContext);

  return (
    <div className="agent-channel-header__container">
      <div className="agent-channel-header__top">
        <img
          alt={channel.data.name}
          src={channel.data.image}
          height="42px"
          width="42px"
        />
        <p className="agent-channel-header__top__name">{channel.data.name}</p>
        <div className="agent-channel-header__top__circle">
          <div className="agent-channel-header__top__dot" />
          <div className="agent-channel-header__top__dot" />
          <div className="agent-channel-header__top__dot" />
        </div>
      </div>
      <div className="agent-channel-header__middle">
        <div className="agent-channel-header__middle__wrapper">
          <PhoneIcon />
          <p className="agent-channel-header__middle__text">
            {channel.data.created_by.phone}
          </p>
        </div>
        <div className="agent-channel-header__middle__wrapper">
          <EmailIcon />
          <p className="agent-channel-header__middle__text email">
            {channel.data.created_by.email}
          </p>
        </div>
      </div>
      <div className="agent-channel-header__bottom__border" />
      <div className="agent-channel-header__bottom">
        <p className="agent-channel-header__bottom__type">Issue</p>
        <p className="agent-channel-header__bottom__selection">
          {channel.data.issue}
        </p>
        <DownIconSmall />
        <p className="agent-channel-header__bottom__type">Status</p>
        <p className="agent-channel-header__bottom__selection">Unresolved</p>
        <DownIconSmall />
      </div>
      <div className="agent-channel-header__bottom__border" />
    </div>
  );
};
