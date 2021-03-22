Here's an example of how to use it:

```js
import {
  Chat,
  Channel,
  ChannelHeader,
  ConnectionStatus,
  VirtualizedMessageList,
  MessageInput,
  MessageInputSimple,
} from '../../components';

const data = require('../../docs/data');

<Chat client={data.client}>
  <Channel channel={data.channel}>
    <div className="str-chat__main-panel" style={{ height: '600px' }}>
      <VirtualizedMessageList />
      <ConnectionStatus />
      <MessageInput Input={MessageInputSimple} />
    </div>
  </Channel>
</Chat>;
```
