import React from 'react';
import {
  ChannelListTeam,
  ChannelList,
  InfiniteScrollPaginator,
} from 'stream-chat-react';

import './ChannelListContainer.css';

const filters = { type: 'team', example: 1 };
const sort = {
  last_message_at: -1,
  cid: 1,
};
const options = {
  member: true,
  watch: true,
  limit: 30,
};

const Paginator = (props) => (
  <InfiniteScrollPaginator threshold={300} {...props} />
);

const SideBar = () => (
  <div className="team__channel-list__sidebar">
    <div className="team__channel-list__sidebar__icon1">
      <div className="icon1__inner">
        <svg
          width="22"
          height="16"
          viewBox="0 0 22 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.0903 16L21.3143 0.291999H17.9263L15.3523 11.116H15.3083L12.6243 0.291999H9.39031L6.6623 10.984H6.6183L4.1323 0.291999H0.678305L4.8363 16H8.3343L10.9523 5.308H10.9963L13.6583 16H17.0903Z"
            fill="#4E1D9D"
          />
        </svg>
      </div>
    </div>
    <div className="team__channel-list__sidebar__icon2">
      <div className="icon2__inner">
        <svg
          width="20"
          height="22"
          viewBox="0 0 20 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.1848 13.5851C12.3269 13.6514 12.4785 13.684 12.6311 13.684C12.8722 13.684 13.1122 13.6008 13.3059 13.4398L19.6215 8.17672C19.8479 7.98725 19.9858 7.71252 19.9984 7.41674C20.0121 7.12095 19.9005 6.83359 19.691 6.62412L13.3753 0.308435C12.9638 -0.103137 12.2985 -0.103137 11.8869 0.308435L9.4733 2.72208L8.11227 1.36105C7.7007 0.949477 7.03545 0.949477 6.62387 1.36105L0.308191 7.67673C-0.103381 8.0883 -0.103381 8.75356 0.308191 9.16513L12.9396 21.7965L14.428 20.3081L7.80385 13.684L11.5785 9.90933V12.6314C11.5785 13.0398 11.8154 13.4114 12.1848 13.5851Z"
            fill="white"
          />
        </svg>
      </div>
    </div>
  </div>
);

const CompanyHeader = () => (
  <div className="team__channel-list__header">
    <p className="team__channel-list__header__text">Worksly</p>
  </div>
);

const ChannelSearch = () => {
  const onSearch = (e) => {
    e.preventDefault();
    console.log(e.target.value);
  };

  return (
    <div className="team__channel-search__container">
      <div className="team__channel-search__input__wrapper">
        <div className="team__channel-search__input__icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 16 16"
          >
            <path
              fill="#fff"
              fillOpacity="0.66"
              fillRule="evenodd"
              d="M2.7 6.95a4.25 4.25 0 117.306 2.954 1.001 1.001 0 00-.102.102A4.25 4.25 0 012.7 6.95zm7.906 5.07a6.25 6.25 0 111.414-1.414l2.987 2.987a1 1 0 11-1.414 1.414l-2.987-2.987z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search"
          onChange={onSearch}
          className="team__channel-search__input__text"
        />
      </div>
    </div>
  );
};

export const ChannelListContainer = () => {
  return (
    <div className="team__channel-list__container">
      <SideBar />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#4E1D9D',
        }}
      >
        <CompanyHeader />
        <ChannelSearch />
        <ChannelList
          filters={filters}
          sort={sort}
          options={options}
          List={ChannelListTeam}
          Paginator={Paginator}
        />
      </div>
    </div>
  );
};
