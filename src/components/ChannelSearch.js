import React from 'react';
import { injectIntl } from 'react-intl';
// import PropTypes from 'prop-types';

class ChannelSearch extends React.PureComponent {
  render() {
    const { intl } = this.props;

    return (
      <div className="str-chat__channel-search">
        <input
          type="text"
          placeholder={intl.formatMessage({
            id: 'channel_search.placeholder',
            defaultMessage: 'Search',
          })}
        />
        <button type="submit">
          <svg
            width="18"
            height="17"
            viewBox="0 0 18 17"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 17.015l17.333-8.508L0 0v6.617l12.417 1.89L0 10.397z"
              fillRule="evenodd"
            />
          </svg>
        </button>
      </div>
    );
  }
}

ChannelSearch = injectIntl(ChannelSearch);
export { ChannelSearch };
