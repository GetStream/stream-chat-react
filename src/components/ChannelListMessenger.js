import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ChannelPreview } from './ChannelPreview';
import { ChannelPreviewMessenger } from './ChannelPreviewMessenger';
import { LoadingChannels } from './LoadingChannels';
import { ChatDown } from './ChatDown';
import { withChatContext } from '../context';

/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @example ./examples/ChannelList.md
 */
class ChannelListMessenger extends PureComponent {
  static propTypes = {
    /** Channels can be either an array of channels or a promise which resolves to an array of channels */
    channels: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.objectOf({
        then: PropTypes.func,
      }),
      PropTypes.object,
    ]).isRequired,
    /** The Preview to use, defaults to ChannelPreviewMessenger */
    Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),

    /** The loading indicator to use */
    LoadingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  };

  static defaultProps = {
    Preview: ChannelPreviewMessenger,
    LoadingIndicator: LoadingChannels,
  };

  renderLoading = () => {
    const Loader = this.props.LoadingIndicator;
    return <Loader isLoading={true} />;
  };

  renderChannels = () =>
    this.props.channels.map((c) => (
      <ChannelPreview
        {...this.props}
        activeChannel={this.props.channel}
        key={c.cid}
        channel={c}
        closeMenu={this.props.closeMenu}
        Preview={this.props.Preview}
      />
    ));

  render() {
    if (this.props.error) {
      return <ChatDown type="Connection Error" />;
    } else if (this.props.loading) {
      return <LoadingChannels />;
    } else {
      return (
        <div className="str-chat__channel-list-messenger">
          <div className="str-chat__channel-list-messenger__main">
            {this.renderChannels()}
          </div>
        </div>
      );
    }
  }
}

ChannelListMessenger = withChatContext(ChannelListMessenger);
export { ChannelListMessenger };
