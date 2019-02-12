/* globals process */
import React, { Component } from 'react';
import { StreamChat } from 'stream-chat-client';
import {
	Chat,
	Channel,
	MessageList,
	MessageInput,
	ChannelHeader,
	// ChannelList,
	LoadingIndicator,
	MessageLivestream,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';
import './styles.css';

const urlParams = new URLSearchParams(window.location.search);
const user = urlParams.get('user') || process.env.REACT_APP_CHAT_API_DEFAULT_USER;
const userToken =
	urlParams.get('user_token') || process.env.REACT_APP_CHAT_API_DEFAULT_USER_TOKEN;

class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			error: false,
			loading: true,
		};

		this.chatClient = new StreamChat(process.env.REACT_APP_CHAT_API_KEY);
		this.chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
		this.chatClient.setUser(
			{
				id: user,
				name: user,
				status: 'available',
				image:
					'https://www.elastic.co/assets/bltada7771f270d08f6/enhanced-buzz-1492-1379411828-15.jpg',
			},
			userToken,
		);
	}

	render() {
		if (this.state.error) {
			return <div>Error: {this.state.error.message}</div>;
		} else if (this.state.loading) {
			return <LoadingIndicator isLoading={true} />;
		} else {
			return (
				<div className="App">
					<div className="str-chat__commerce">
						<Chat client={this.chatClient} Message={MessageLivestream}>
							{/* <ChannelList /> */}
							<Channel>
								<ChannelHeader type="Livestream" />

								<MessageList />
								<MessageInput focus />
							</Channel>
						</Chat>
					</div>
				</div>
			);
		}
	}
}

export default App;
