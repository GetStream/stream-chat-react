import React, { useEffect, useState } from 'react';
import { ChannelSort, StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  ChannelListMessenger,
  ChannelListMessengerProps,
  ChannelPreviewMessenger,
  MessageList,
  MessageInput,
  Thread,
  Window,
  useChatContext,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';
import './App.css';

const apiKey = process.env.REACT_APP_STREAM_KEY as string;
const userId = process.env.REACT_APP_USER_ID as string;
const userToken = process.env.REACT_APP_USER_TOKEN as string;

const filters = { type: 'messaging' };
const teamFilters = { type: 'team '};
const options = { state: true, presence: true, limit: 10 };
const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

const chatClient = StreamChat.getInstance(apiKey);

if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
  chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
}

chatClient.connectUser({ id: userId }, userToken);

const CustomChannelListTeam: React.FC<ChannelListMessengerProps> = (props) => {
  const { children, loadedChannels } = props;

  const { client } = useChatContext();

  const [newChannels, setNewChannels] = useState(children);

  useEffect(() => {
    let newChildren = children;
    setNewChannels(newChildren);

    const handleEvent = (event: any) => {
      console.log('loadedChannels:', loadedChannels);
      let includedInList = loadedChannels?.map((channel) => channel.id).includes(event.channel_id);
      if (!includedInList) {
        console.log(children);
        // @ts-expect-error
        let thing = newChildren?.props?.children ? newChildren?.props?.children.filter((channel) => channel.id !== event.channel_id) : undefined;
        setNewChannels(thing);
      }
    };

    client.on('message.new', handleEvent);

    return () => {
      client.off('message.new', handleEvent);
    };
  }, [children, client, loadedChannels]);

  return (
    <div>{newChannels}</div>
  )
}

const CustomChannelListMessaging: React.FC<ChannelListMessengerProps> = (props) => {
  const { children, loadedChannels } = props;

  const { client } = useChatContext();

  const [newChannels, setNewChannels] = useState(children);

  // chatClient.on((event) => {
  //   if (event.type === "message.new") {
  //     let channelIncluded = loadedChannels?.map((channel) => channel.id).includes(event.channel_id);
  //     if (!channelIncluded) {
  //       setNewChannels(loadedChannels?.filter((channel) => channel.id !== event.channel_id));
  //     }
  //   }
  // })

  useEffect(() => {
    let newChildren = children;

    setNewChannels(newChildren);

    const handleEvent = (event: any) => {
      console.log('loadedChannels in messaging:', loadedChannels);
      let channelIncluded = loadedChannels?.map((channel) => channel.id).includes(event.channel_id);
      if (!channelIncluded) {
        // @ts-expect-error
        newChildren = newChildren?.props?.children?.filter((channel: any) => channel.id !== event.channel_id);
        setNewChannels(newChildren);
      }
    };

    client.on('message.new', handleEvent);

    return () => {
      client.off('message.new', handleEvent);
    };
  }, [children, client, loadedChannels]);

  return (
    <div className='str-chat__channel-list-messenger__main'>{newChannels}</div>
  )
}

const App = () => (
  <Chat client={chatClient}>
    <ChannelList
      List={CustomChannelListMessaging}
      Preview={ChannelPreviewMessenger}
      filters={filters}
      sort={sort}
      options={options}
      sendChannelsToList={true}
    />
    <ChannelList
      List={CustomChannelListTeam}
      Preview={ChannelPreviewMessenger}
      filters={teamFilters}
      sort={sort}
      options={options}
      sendChannelsToList={true}
    />
    <Channel>
      <Window>
        <ChannelHeader />
        <MessageList />
        <MessageInput />
      </Window>
      <Thread />
    </Channel>
  </Chat>
);

export default App;

