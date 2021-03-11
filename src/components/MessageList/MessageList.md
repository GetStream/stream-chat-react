Here's an example of how to render a list of messages:

```js
import { Chat, Channel, MessageList } from '../../components';

const data = require('../../docs/data');

<Chat client={data.client}>
  <Channel channel={data.channel}>
    <MessageList />
  </Channel>
</Chat>;
```
