Here's an example with a customized error message:

```js
import { Chat } from '../';
import { ChatDown } from './ChatDown';

const image =
  'https://images.unsplash.com/photo-1527974349915-0d7b47258c02?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=120&q=80';
const text =
  'Unfortunately the network is down. Check your wifi and try again later';

<div className="str-chat">
  <Chat>
    <ChatDown image={image} type='Network Error' text={text} />
  </Chat>
</div>;
```

And here's a version using defaults:

```js
import { Chat } from '../';
import { ChatDown } from './ChatDown';

const data = require('../../docs/data');

<div className="str-chat">
  <Chat>
    <ChatDown {...data.translationContext} />
  </Chat>
</div>;
```
