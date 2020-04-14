```js
import {
  Chat,
  Channel,
  MessageTeam,
  MessageInput,
  MessageInputSmall,
} from '../components';

const data = require('./data');

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client} Message={MessageTeam}>
    <Channel channel={data.channel}>
      <MessageInput Input={MessageInputSmall} {...data.translationContext} />
    </Channel>
  </Chat>
</div>;
```
