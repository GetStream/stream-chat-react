```js
import { MessageInput } from './MessageInput';
import { MessageInputFlat } from './MessageInputFlat';

import { Channel } from '../Channel/Channel';
import { Chat } from '../Chat/Chat';
import { MessageTeam } from '../Message/MessageTeam';

const data = require('../../docs/data');

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client} Message={MessageTeam}>
    <Channel channel={data.channel}>
      <MessageInput
        Input={MessageInputFlat}
        grow={true}
        focus={false}
        {...data.translationContext}
      />
    </Channel>
  </Chat>
</div>;
```
