// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Avatar } from '../Avatar';
import { ChannelContext, TranslationContext, ChatContext } from '../../context';

/**
 * ChannelHeader - Render some basic information about this channel
 * @example ../../docs/ChannelHeader.md
 * @type {React.FC<import('types').ChannelHeaderProps>}
 */
const ChannelHeader = ({ title, live }) => {
  /** @type {import("types").TranslationContextValue} */
  const { t } = useContext(TranslationContext);
  /** @type {import("types").ChannelContextValue} */
  const { channel, watcher_count } = useContext(ChannelContext);
  const { openMobileNav } = useContext(ChatContext);

  return (
    <div className="str-chat__header-livestream">
      <div className="str-chat__header-hamburger" onClick={openMobileNav}>
        <span className="str-chat__header-hamburger--line"></span>
        <span className="str-chat__header-hamburger--line"></span>
        <span className="str-chat__header-hamburger--line"></span>
      </div>
      {channel && channel.data.image && (
        <Avatar
          image={channel.data.image}
          shape="rounded"
          size={channel.type === 'commerce' ? 60 : 40}
        />
      )}
      <div className="str-chat__header-livestream-left">
        <p className="str-chat__header-livestream-left--title">
          {title || (channel && channel.data.name)}{' '}
          {live && (
            <span className="str-chat__header-livestream-left--livelabel">
              {t('live')}
            </span>
          )}
        </p>
        {channel && channel.data.subtitle && (
          <p className="str-chat__header-livestream-left--subtitle">
            {channel.data.subtitle}
          </p>
        )}
        <p className="str-chat__header-livestream-left--members">
          {!live &&
            channel &&
            channel.data.member_count &&
            channel.data.member_count > 0 && (
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
};

ChannelHeader.propTypes = {
  /** Set title manually */
  title: PropTypes.string,
  /** Show a little indicator that the channel is live right now */
  live: PropTypes.bool,
};

export default React.memo(ChannelHeader);
