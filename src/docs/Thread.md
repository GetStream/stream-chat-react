The Thread renders a parent message with a list of replies.

The threadHasMore={false} disables pagination for this example.

```js
import { Chat, Channel, Thread, MessageTeam } from '../components';
import { ChannelContext } from '../context';

const data = require('./data');

<Chat client={data.client}>
  <Channel channel={data.channel}>
    <ChannelContext.Provider value={data.channelContext}>
      <Thread Message={MessageTeam} fullWidth autoFocus={false} />
    </ChannelContext.Provider>
  </Channel>
</Chat>;
```
