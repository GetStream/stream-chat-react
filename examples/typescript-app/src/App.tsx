import React from 'react';
import { ChannelSort, StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  ChannelListMessenger,
  ChannelPreviewMessenger,
  // ChannelSearchFunctionParams,
  MessageList,
  MessageInput,
  MessageInputFlat,
  Thread,
  Window,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';
import './App.css';

// import throttle from 'lodash.throttle';

const apiKey = process.env.REACT_APP_STREAM_KEY as string;
const userId = process.env.REACT_APP_USER_ID as string;
const userToken = process.env.REACT_APP_USER_TOKEN as string;
const theme = 'light';

const filters = { type: 'messaging' };
const options = { state: true, presence: true, limit: 10 };
const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

const chatClient = StreamChat.getInstance(apiKey);

if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
  chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
}

chatClient.connectUser({ id: userId }, userToken);

const App = () => {

  // const getChannels = async (text: string, setSearching: any, setResults: any, setResultsOpen: any) => {
  //   if (!text) return;
  //     setSearching(true);

  //     setSearching(false);
  // }

  // try {
  //   const channelResponse = client.queryChannels(
  //     {
  //       type: 'team',
  //       name: { $autocomplete: text },
  //     },
  //     {},
  //     { limit: 5 },
  //   );

  //   const userResponse = client.queryUsers(
  //     {
  //       id: { $ne: client.userID || '' },
  //       $and: [
  //         { name: { $autocomplete: text } },
  //         { name: { $nin: ['Daniel Smith', 'Kevin Rosen', 'Jen Alexander'] } },
  //       ],
  //     },
  //     { id: 1 },
  //     { limit: 5 },
  //   );

  //   const [channels, { users }] = await Promise.all([channelResponse, userResponse]);

  //   if (channels.length) setTeamChannels(channels);
  //   if (users.length) setDirectChannels(users);
  //   setAllChannels([...channels, ...users]);
  // } catch (event) {
  //   setQuery('');
  // }

  // const throttleChannels = throttle(getChannels, 200);

  // const searchFunction = (params: ChannelSearchFunctionParams, event: React.BaseSyntheticEvent) => {
  //   // event.preventDefault();
  //   // setQuery(event.target.value);
  //   // getChannelsThrottled(event.target.value);
  //   console.log('params IS:', params);
  //   params.setQuery(event.target.value);
  //   throttleChannels(event.target.value, params.setSearching, params.setResults, params.setResultsOpen);
  // };

  // params are:
  // setQuery,
  // setResults,
  // setResultsOpen,
  // setSearching

  // searchFunction?: (
  //   params: ChannelSearchFunctionParams<Us>,
  //   event: React.BaseSyntheticEvent,
  // ) => Promise<void> | void;
  
  return (
    <Chat client={chatClient} theme={`messaging ${theme}`}>
      <ChannelList
        List={ChannelListMessenger}
        Preview={ChannelPreviewMessenger}
        filters={filters}
        sort={sort}
        options={options}
        showChannelSearch
        // additionalChannelSearchProps={{ searchFunction: searchFunction }}
      />
      <Channel>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput Input={MessageInputFlat} focus />
        </Window>
        <Thread />
      </Channel>
    </Chat>
  )
};

export default App;
