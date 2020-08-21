The VirtualMessageList renders a list of messages in a virtualized list.
It works pretty well when there are thousands of messages in your channel, it has a shortcoming though, the Message UI should have a fixed height.

Here's an example of how to use it:

```js
import {
  Chat,
  Channel,
  ChannelHeader,
  ConnectionStatus,
  VirtualMessageList,
  MessageInput,
  MessageInputSimple,
} from '../components';

const data = require('./data');

<Chat client={data.client}>
  <Channel channel={data.channel}>
    <div className="str-chat__main-panel" style={{ height: '600px' }}>
      <VirtualMessageList />
      <ConnectionStatus />
      <MessageInput Input={MessageInputSimple} />
    </div>
  </Channel>
</Chat>;
```
