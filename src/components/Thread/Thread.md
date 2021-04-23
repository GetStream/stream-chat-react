<!-- The threadHasMore={false} disables pagination for this example.

```js
import { Thread } from './Thread';

import { Channel } from '../Channel/Channel';
import { Chat } from '../Chat/Chat';
import { MessageTeam } from '../Message/MessageTeam';

import { ChannelContext } from '../../context/ChannelContext';

const data = require('../../docs/data');

<Chat client={data.client}>
  <Channel channel={data.channel}>
    <ChannelContext.Provider value={data.channelContext}>
      <Thread Message={MessageTeam} fullWidth autoFocus={false} />
    </ChannelContext.Provider>
  </Channel>
</Chat>;
``` -->
