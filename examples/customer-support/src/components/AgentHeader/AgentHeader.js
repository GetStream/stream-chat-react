import React from 'react';

import './AgentHeader.css';

import { BellIcon } from '../../assets/BellIcon';
import { DownIcon } from '../../assets/DownIcon';
import { HeadsetIcon } from '../../assets/HeadsetIcon';
import { TalkingIcon } from '../../assets/TalkingIcon';

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
        <DownIcon />
      </div>
    </div>
  );
};
