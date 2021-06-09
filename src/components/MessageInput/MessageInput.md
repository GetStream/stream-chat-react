```js
import { MessageInput } from './MessageInput';

import { Channel } from '../Channel/Channel';
import { Chat } from '../Chat/Chat';

const data = require('../../docs/data');

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client}>
    <Channel channel={data.channel}>
      <MessageInput />
    </Channel>
  </Chat>
</div>;
```
