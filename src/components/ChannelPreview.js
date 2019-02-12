import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { ChannelPreviewCountOnly } from './ChannelPreviewCountOnly';

export class ChannelPreview extends PureComponent {
	constructor(props) {
		super(props);

		this.state = {
			unread: 0,
			lastMessage: {},
			lastSeen: new Date(),
		};
	}

	static propTypes = {
		channel: PropTypes.object.isRequired,
		client: PropTypes.object.isRequired,
		activeChannel: PropTypes.object.isRequired,
		setActiveChannel: PropTypes.func.isRequired,
		Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
	};

	static defaultProps = {
		Preview: ChannelPreviewCountOnly,
	};

	componentDidMount() {
		// listen to change...
		const c = this.props.channel;
		c.on('message.new', event => {
			const isActive = this.props.activeChannel.cid === this.props.channel.cid;
			if (!isActive) {
				const unread = c.countUnread(this.state.lastSeen);
				this.setState({ lastMessage: event.message, unread });
			}
		});
	}

	componentDidUpdate(prevProps) {
		if (this.props.activeChannel.cid !== prevProps.activeChannel.cid) {
			const isActive = this.props.activeChannel.cid === this.props.channel.cid;
			if (isActive) {
				this.setState({ unread: 0, lastSeen: new Date() });
			}
		}
	}

	render() {
		const props = { ...this.state, ...this.props };

		const { Preview } = this.props;

		return (
			<Preview
				{...props}
				active={this.props.activeChannel.cid === this.props.channel.cid}
			/>
		);
	}
}
