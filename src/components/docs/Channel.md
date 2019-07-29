### Channel context

The channel component provides the channel context to the underlying components.

The channel context provides the following properties:

- `messages` {Array} List of immutable [message objects](https://getstream.io/chat/docs/#message_format)
- `online` {number} A count of the online users
- `typing` {ImmutableObject} A map of user ids of users who are typing vs corresponding typing [event object](https://getstream.io/chat/docs/#event_object) (where event type is `typing.start`).

  e.g.

  ```json
  {
    "user_id_1": typing_event_object_of_user_1,
    "user_id_2": typing_event_object_of_user_2
  }
  ```

- `watcher_count` {number} Count of watchers
- `watchers` {ImmutableObject} A map of user ids vs users who are currently watching the channel.

e.g.,

```json
{
  "thierry": {
    "id": "thierry",
    "role": "user",
    "created_at": "2019-04-03T14:42:47.087869Z",
    "updated_at": "2019-04-16T09:20:03.982283Z",
    "last_active": "2019-04-16T11:23:51.168113408+02:00",
    "online": true
  },
  "vishal": {
    "id": "vishal",
    "role": "user",
    "created_at": "2019-05-03T14:42:47.087869Z",
    "updated_at": "2019-05-16T09:20:03.982283Z",
    "last_active": "2019-06-16T11:23:51.168113408+02:00",
    "online": true
  }
}
```

- `members` {ImmutableObject} Members of this channel (members are permanent, watchers are users who are online right now)

e.g.,

```json
{
  "thierry": {
    "id": "thierry",
    "role": "user",
    "created_at": "2019-04-03T14:42:47.087869Z",
    "updated_at": "2019-04-16T09:20:03.982283Z",
    "last_active": "2019-04-16T11:23:51.168113408+02:00",
    "online": true
  },
  "vishal": {
    "id": "vishal",
    "role": "user",
    "created_at": "2019-05-03T14:42:47.087869Z",
    "updated_at": "2019-05-16T09:20:03.982283Z",
    "last_active": "2019-06-16T11:23:51.168113408+02:00",
    "online": false
  }
}
```

- read: the read state for each user
- `error` {boolean} Bool indicating if there was an issue loading the channel
- `loading` {boolean} if the channel is currently loading
- `loadingMore` {boolean} if the channel is loading pagination
- `hasMore` {boolean} if the channel has more messages to paginate through

These functions:

- **sendMessage** The function to send a message on channel.

  **Params**

  - `message`: A [message object](https://getstream.io/chat/docs/#message_format) of message to be sent.

- **updateMessage** The function to update a message on channel.

  **Params**

  - `updatedMessage`: Updated [message object](https://getstream.io/chat/docs/#message_format)

- **retrySendMessage** The function to resend a message, handled by the Channel component

  **Params**

  - `message`: A [message](https://getstream.io/chat/docs/#message_format) to be sent

- **removeMessage** The function to remove a message from messagelist, handled by the Channel component

  **Params**

  - `message`: A [message](https://getstream.io/chat/docs/#message_format) to be removed

- **onMentionsClick** The function to execute when @mention is clicked in message.

  **Params**

  - `event` DOM click event object
  - `mentioned_users` Array of mentioned users in message. This array is available in message object.

- **onMentionsHover** The function to execute when @mention is hovered on message.

  **Params**

  - `event` DOM click event object
  - `mentioned_users` Array of mentioned users in message. This array is available in message object.

- **openThread** Function to execute when replies count button is clicked.

  **Params**

  - `message` Parent message of thread which needs to be opened
  - `event` DOM click event

- **loadMore** Function to load next page/batch of messages (used for pagination). Next batch of results will be available in `messages` object in channel context.
- **closeThread** Function to close the currently open thread. This function should be attached to close button on thread UI.
- **loadMoreThread** Function to load next page/batch of messages in a currently active/open thread ((used for pagination).

And the data exposed by the chat context:

- client (the client connection)
- channels (the list of channels)
- setActiveChannel (a function to set the currently active channel)
- channel (the currently active channel)

```js
const data = require('./data');

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client}>
    <Channel channel={data.channel}>
      <div className="str-chat__main-panel" style={{ height: '500px' }}>
        <MessageList />
        <MessageInput />
      </div>
    </Channel>
  </Chat>
</div>;
```

The example below shows how to add a channel header and support for threads.
You can test threads and replies by clicking the reply button on the message.
(Shown on hover..)

```js
const data = require('./data');

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client}>
    <Channel channel={data.channel}>
      <div className="str-chat__main-panel" style={{ height: '500px' }}>
        <ChannelHeader />
        <MessageList />
        <MessageInput />
      </div>
      <Thread />
    </Channel>
  </Chat>
</div>;
```

To combine the channel with the ChannelList for selecting your channel check out this example.
Note how we are not setting the <Channel channel={} /> property, but instead are relying on the channel list to set the currently active channel.

```js
const data = require('./data');

const filters = { type: 'team', example: 1 };
const sort = {
  last_message_at: -1,
  cid: 1,
};
const options = {
  member: true,
  watch: true,
  limit: 3,
};

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client}>
    <ChannelList
      List={ChannelListMessenger}
      Preview={ChannelPreviewMessenger}
      filters={filters}
      options={options}
      sort={sort}
    />
    <Channel>
      <div className="str-chat__main-panel" style={{ height: '500px' }}>
        <MessageList />
        <MessageInput />
      </div>
    </Channel>
  </Chat>
</div>;
```

The Channel produces the ChannelContext and exposes a withChannelContext HOC.
The example below shows you how to write components that consume the channel context.

```js
const data = require('./data');
const React = require('react');
const ChatComponents = require('../');

class CustomChannelHeader extends React.PureComponent {
  render() {
    return (
      <div>
        There are currently {this.props.watcher_count} people online in channel
        {this.props.channel.cid}. These users are typing:
        <span className="str-chat__input-footer--typing">
          {ChatComponents.formatArray(Object.keys(this.props.typing))}
        </span>
      </div>
    );
  }
}

CustomChannelHeader = ChatComponents.withChannelContext(CustomChannelHeader);

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client}>
    <Channel channel={data.channel}>
      <div className="str-chat__main-panel" style={{ height: '500px' }}>
        <CustomChannelHeader />
        <MessageList />
        <MessageInput />
      </div>
    </Channel>
  </Chat>
</div>;
```
