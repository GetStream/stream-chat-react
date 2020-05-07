```js
import {
  Chat,
  Channel,
  MessageTeam,
  MessageInput,
  MessageInputFlat,
} from '../components';

const data = require('./data');

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
