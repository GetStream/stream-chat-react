The channel component provides the channel context to the underlying components.

The channel context provides the following properties:

- messages: the list of immutable messages
- online: a count of the online users
- typing: who is currently typing
- watchers: who is currently online
- members: members of this channel (members are permanent, watchers are users who are online right now)
- read: the read state for each user
- error: bool indicating if there was an issue loading the channel
- loading: if the channel is currently loading
- loadingMore: if the channel is loading pagination
- hasMore: if the channel has more messages to paginate through

These functions:

- updateMessage
- removeMessage
- sendMessage
- retrySendMessage
- resetNotification
- loadMore

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

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client}>
    <ChannelList channels={data.channels} />
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
