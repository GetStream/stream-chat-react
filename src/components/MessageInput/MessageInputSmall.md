```js
import { MessageInput } from './MessageInput';
import { MessageInputSmall } from './MessageInputSmall';

import { Channel } from '../Channel/Channel';
import { Chat } from '../Chat/Chat';
import { MessageTeam } from '../Message/MessageTeam';

const data = require('../../docs/data');

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client} Message={MessageTeam}>
    <Channel channel={data.channel}>
      <MessageInput Input={MessageInputSmall} {...data.translationContext} />
    </Channel>
  </Chat>
</div>;
```
