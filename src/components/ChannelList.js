import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ChannelPreviewLastMessage } from './ChannelPreviewLastMessage';
import { LoadingIndicator } from './LoadingIndicator';
import { withChatContext } from '../context';
import { ChannelListTeam } from './ChannelListTeam';
import { isPromise } from '../utils';

/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @extends PureComponent
 * @example ./docs/ChannelList.md
 */

class ChannelList extends PureComponent {
  static propTypes = {
    /** Channels can be either an array of channels or a promise which resolves to an array of channels */
    channels: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.objectOf({
        then: PropTypes.func,
      }),
      PropTypes.object,
    ]).isRequired,
    /** The Preview to use, defaults to ChannelPreviewLastMessage */
    Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),

    /** The loading indicator to use */
    LoadingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    List: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  };

  static defaultProps = {
    Preview: ChannelPreviewLastMessage,
    LoadingIndicator,
    List: ChannelListTeam,
  };

  constructor(props) {
    super(props);
    this.state = { error: false, loading: true, channels: [] };
  }

  async componentDidMount() {
    try {
      let channelQueryResponse = this.props.channels;
      if (isPromise(channelQueryResponse)) {
        channelQueryResponse = await this.props.channels;
        if (channelQueryResponse.length >= 1) {
          this.props.setActiveChannel(channelQueryResponse[0]);
        }
      }
      this.setState({ loading: false, channels: channelQueryResponse });
    } catch (e) {
      this.setState({ error: true });
    }
  }

  static getDerivedStateFromError() {
    return { error: true };
  }

  componentDidCatch(error, info) {
    console.warn(error, info);
  }

  clickCreateChannel = (e) => {
    this.props.setChannelStart();
    e.target.blur();
  };

  render() {
    const context = {
      clickCreateChannel: this.clickCreateChannel,
    };
    const List = this.props.List;
    return (
      <div className={`str-chat str-chat-channel-list ${this.props.theme}`}>
        <List {...this.props} {...this.state} {...context} />
      </div>
    );
  }
}

ChannelList = withChatContext(ChannelList);
export { ChannelList };
