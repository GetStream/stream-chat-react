import React from 'react';
import PropTypes from 'prop-types';
import { Avatar } from '../';
import {
  withChatContext,
  withChannelContext,
  withTranslationContext,
} from '../../context';

/**
 * ChannelHeader - Render some basic information about this channel
 *
 * @example ../docs/ChannelHeader.md
 * @extends PureComponent
 */
const ChannelHeader = ({
  openMobileNav,
  channel,
  title,
  live,
  watcher_count,
  t,
}) => (
  <div className="str-chat__header-livestream">
    <div className="str-chat__header-hamburger" onClick={openMobileNav}>
      <span className="str-chat__header-hamburger--line"></span>
      <span className="str-chat__header-hamburger--line"></span>
      <span className="str-chat__header-hamburger--line"></span>
    </div>
    {channel.data.image && (
      <Avatar
        image={channel.data.image}
        shape="rounded"
        size={channel.type === 'commerce' ? 60 : 40}
      />
    )}
    <div className="str-chat__header-livestream-left">
      <p className="str-chat__header-livestream-left--title">
        {title || channel.data.name}{' '}
        {live && (
          <span className="str-chat__header-livestream-left--livelabel">
            {t('live')}
          </span>
        )}
      </p>
      {channel.data.subtitle && (
        <p className="str-chat__header-livestream-left--subtitle">
          {channel.data.subtitle}
        </p>
      )}
      <p className="str-chat__header-livestream-left--members">
        {!live && channel.data.member_count > 0 && (
          <>
            {t('{{ memberCount }} members', {
              memberCount: channel.data.member_count,
            })}
            ,{' '}
          </>
        )}
        {t('{{ watcherCount }} online', { watcherCount: watcher_count })}
      </p>
    </div>
  </div>
);

ChannelHeader.propTypes = {
  /** Set title manually */
  title: PropTypes.string,
  /** Show a little indicator that the channel is live right now */
  live: PropTypes.bool,
  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: PropTypes.object.isRequired,
  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#chat)** */
  watcher_count: PropTypes.number,
};

export default withChannelContext(
  withTranslationContext(withChatContext(ChannelHeader)),
);
