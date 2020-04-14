```js
import {
  Chat,
  Channel,
  MessageTeam,
  MessageInput,
  MessageInputLarge,
} from '../components';

const data = require('./data');

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client} Message={MessageTeam}>
    <Channel channel={data.channel}>
      <MessageInput Input={MessageInputLarge} {...data.translationContext} />
    </Channel>
  </Chat>
</div>;
```
