/* eslint-disable global-require */
import React from 'react';

import './AgentHeader.css';

import { BellIcon, DownIcon, HeadsetIcon, TalkingIcon } from '../../assets';

export const AgentHeader = () => {
  return (
    <div className="agent-header__container">
      <div className="agent-header__left">
        <HeadsetIcon />
        <p className="agent-header__left__text">37 Agents Online</p>
        <TalkingIcon />
        <p className="agent-header__left__text">Serving 85 Customers</p>
      </div>
      <div className="agent-header__right">
        <div className="active-slider__background">
          <div className="active-slider__ball" />
        </div>
        <p className="agent-header__left__text">Active</p>
        <BellIcon />
        <img
          src={require('../../assets/user1.png')}
          alt="user-1"
          height="35"
          width="35"
        />
        <DownIcon />
      </div>
    </div>
  );
};
