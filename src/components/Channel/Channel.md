```js
const data = require('../../docs/data');
import { Chat, Channel, MessageList, MessageInput } from '../../components';

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

The example below shows how to add a ChannelHeader and support for Threads.
You can test Threads and replies by clicking the reply button on the message.
(Shown on hover..)

```js
const data = require('../../docs/data');
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
} from '../../components';

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

To combine the Channel with the ChannelList for selecting your Channel check out this example.
Note how we are not setting the `<Channel channel={} />` property, but instead are relying on the ChannelList to set the currently active channel.

```js
const data = require('../../docs/data');
import {
  Chat,
  Channel,
  ChannelList,
  ChannelListMessenger,
  ChannelPreviewMessenger,
  MessageList,
  MessageInput,
} from '../../components';

const filters = { type: 'team' };
const sort = {
  last_message_at: -1,
  cid: 1,
};
const options = {
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

The example below shows you how to write components that consume the ChannelContext.

```json
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

ContextAwareCustomChannelHeader = ChatComponents.withChannelContext(CustomChannelHeader);

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client}>
    <Channel channel={data.channel}>
      <div className="str-chat__main-panel" style={{ height: '500px' }}>
        <ContextAwareCustomChannelHeader />
        <MessageList />
        <MessageInput />
      </div>
    </Channel>
  </Chat>
</div>;
```
