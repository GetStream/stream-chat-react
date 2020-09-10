// @ts-check

import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { Avatar } from '../Avatar';
import { ChatDown } from '../ChatDown';
import { LoadingChannels } from '../Loading';
import { ChatContext } from '../../context';

import chevrondown from '../../assets/str-chat__icon-chevron-down.svg';

/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @example ../../docs/ChannelList.md
 * @type React.FC<import('types').ChannelListUIComponentProps>
 */
const ChannelListTeam = ({
  error = false,
  loading,
  sidebarImage,
  showSidebar,
  LoadingErrorIndicator = ChatDown,
  LoadingIndicator = LoadingChannels,
  children,
}) => {
  const { client } = useContext(ChatContext);
  const { id, image, name, status } = client.user || {};

  if (error) {
    return <LoadingErrorIndicator type="Connection Error" />;
  }
  if (loading) {
    return <LoadingIndicator />;
  }
  return (
    <div className="str-chat__channel-list-team">
      {showSidebar && (
        <div className="str-chat__channel-list-team__sidebar">
          <div className="str-chat__channel-list-team__sidebar--top">
            <Avatar image={sidebarImage} size={50} />
          </div>
        </div>
      )}
      <div className="str-chat__channel-list-team__main">
        <div className="str-chat__channel-list-team__header">
          <div className="str-chat__channel-list-team__header--left">
            <Avatar image={image} name={name || id} size={40} />
          </div>
          <div className="str-chat__channel-list-team__header--middle">
            <div className="str-chat__channel-list-team__header--title">
              {name || id}
            </div>
            <div
              className={`str-chat__channel-list-team__header--status ${status}`}
            >
              {status}
            </div>
          </div>
          <div className="str-chat__channel-list-team__header--right">
            <button className="str-chat__channel-list-team__header--button">
              <img src={chevrondown} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

ChannelListTeam.propTypes = {
  /** When true, loading indicator is shown - [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js) */
  loading: PropTypes.bool,
  /** When true, error indicator is shown - [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js) */
  error: PropTypes.bool,
  /** When true, sidebar containing logo of the team is visible */
  showSidebar: PropTypes.bool,
  /** Url for sidebar logo image. */
  sidebarImage: PropTypes.string,
  /**
   * Loading indicator UI Component. It will be displayed if `loading` prop is true.
   *
   * Defaults to and accepts same props as:
   * [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js)
   *
   */
  LoadingIndicator: /** @type {PropTypes.Validator<React.ElementType<import('types').LoadingIndicatorProps>>} */ (PropTypes.elementType),
  /**
   * Error indicator UI Component. It will be displayed if `error` prop is true
   *
   * Defaults to and accepts same props as:
   * [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js)
   *
   */
  LoadingErrorIndicator: /** @type {PropTypes.Validator<React.ElementType<import('types').ChatDownProps>>} */ (PropTypes.elementType),
};

export default ChannelListTeam;
