```js
import { Chat } from '../Chat';
import { MessageTeam } from '../MessageTeam';
import { Channel } from '../Channel';
import { MessageInput } from '../MessageInput';
import { MessageInputLarge } from '../MessageInputLarge';

const data = require('./data');

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client} Message={MessageTeam}>
    <Channel channel={data.channel}>
      <MessageInput Input={MessageInputLarge} />
    </Channel>
  </Chat>
</div>;
```
