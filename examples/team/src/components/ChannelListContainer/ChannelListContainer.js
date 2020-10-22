import React from 'react';
import { ChannelList } from 'stream-chat-react';

import { TeamChannelList } from '../TeamChannelList/TeamChannelList';
import { TeamChannelPreview } from '../TeamChannelPreview/TeamChannelPreview';
import { SideBarLogo } from '../../assets/SideBarLogo';
import { SideBarFlag } from '../../assets/SideBarFlag';
import { SearchIcon } from '../../assets/SearchIcon';

import './ChannelListContainer.css';

const SideBar = () => (
  <div className="channel-list__sidebar">
    <div className="channel-list__sidebar__icon1">
      <div className="icon1__inner">
        <SideBarLogo />
      </div>
    </div>
    <div className="channel-list__sidebar__icon2">
      <div className="icon2__inner">
        <SideBarFlag />
      </div>
    </div>
  </div>
);

const CompanyHeader = () => (
  <div className="channel-list__header">
    <p className="channel-list__header__text">Worksly</p>
  </div>
);

const ChannelSearch = () => {
  const onSearch = (e) => {
    e.preventDefault();
    console.log(e.target.value);
  };

  return (
    <div className="channel-search__container">
      <div className="channel-search__input__wrapper">
        <div className="channel-search__input__icon">
          <SearchIcon />
        </div>
        <input
          type="text"
          placeholder="Search"
          onChange={onSearch}
          className="channel-search__input__text"
        />
      </div>
    </div>
  );
};

export const ChannelListContainer = () => {
  const options = {
    member: true,
    watch: true,
    limit: 3,
  };

  return (
    <div className="channel-list__container">
      <SideBar />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#4E1D9D',
          width: '240px',
        }}
      >
        <CompanyHeader />
        <ChannelSearch />
        <ChannelList
          filters={{ type: 'team' }}
          sort={{ last_message_at: -1 }}
          options={options}
          List={(props) => <TeamChannelList {...props} type="team" />}
          Preview={(props) => <TeamChannelPreview {...props} type="team" />}
        />
        <ChannelList
          filters={{ type: 'messaging' }}
          sort={{ last_message_at: -1 }}
          options={options}
          List={(props) => <TeamChannelList {...props} type="messaging" />}
          Preview={(props) => (
            <TeamChannelPreview {...props} type="messaging" />
          )}
        />
      </div>
    </div>
  );
};
