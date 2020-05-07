The channel header component renders some basic information about a channel:

```js
const data = require('./data');
import { ChannelHeader } from '../components';

<ChannelHeader
  channel={data.channel}
  online={23}
  live={true}
  {...data.translationContext}
/>;
```

Example of ChannelHeader component usage:

```js
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
} from '../components';

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

You can put any custom UI component on top of MessageList to behave as header.
If you need access to numerous properties defined in ChannelContext or ChatContext, you can simply use wrapper functions [`withChannelContext`](#withchannelcontext) or [`withChatContext`](withchatcontext) (which act as Context provider)
around your custom component.

E.g.,

```js static
const CustomChannelHeader = withChannelContext(
  class CustomChannelHeader extends React.PureComponent {
    render() {
      return (
        <div>
          There are currently {this.props.watcher_count} people online in
          channel
          {this.props.channel.cid}. These users are typing:
          <span className="str-chat__input-footer--typing">
            {ChatComponents.formatArray(Object.keys(this.props.typing))}
          </span>
        </div>
      );
    }
  },
);

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
