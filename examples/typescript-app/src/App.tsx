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
import { DropdownContainerProps } from '../../../dist/components/ChannelSearch/SearchResults';
import { ChannelOrUserType } from '../../../dist/components/ChannelSearch/utils';
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

  const SearchResultsHeader = () => {
    return <div>Search Results Header!</div>
  }

  const CustomDropdown = (props: DropdownContainerProps) => {
    const { results, focusedUser, selectResult, SearchResultItem } = props;

    console.log(results);

    let items: ChannelOrUserType[] = results.filter(x => x.cid);
    let users: ChannelOrUserType[] = results.filter(x => !x.cid);

    return (
      <div>
        <p>Channels</p>
        {items.map((result: ChannelOrUserType, index: number) => (
          <SearchResultItem
            focusedUser={focusedUser}
            index={index}
            key={index}
            result={result}
            selectResult={selectResult}
          />
        ))}
        <p>Users</p>
        {users.map((result: ChannelOrUserType, index: number) => (
          <SearchResultItem
            focusedUser={focusedUser}
            index={index}
            key={index}
            result={result}
            selectResult={selectResult}
          />
        ))}
      </div>
    );
  };

  // const CustomItem = () => {
  //   return <div>custom item</div>;
  // }
  
  return (
    <Chat client={chatClient} theme={`messaging ${theme}`}>
      <ChannelList
        List={ChannelListMessenger}
        Preview={ChannelPreviewMessenger}
        filters={filters}
        sort={sort}
        options={options}
        showChannelSearch
        additionalChannelSearchProps={
          {
            popupResults: true,
            searchForChannels: true,
            SearchResultsHeader: SearchResultsHeader,
            DropdownContainer: (props) => <CustomDropdown {...props} />
          }
        }
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
