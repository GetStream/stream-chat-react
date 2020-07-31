The VirtualizedMessageList component does exactly that, it renders a list of messages - just super fast.

Here's an example of how to render a list of messages:

```js
import { Chat, Channel, VirtualizedMessageList } from '../components';

const data = require('./data');

<Chat client={data.client}>
  <Channel channel={data.channel}>
    <VirtualizedMessageList />
  </Channel>
</Chat>;
```
