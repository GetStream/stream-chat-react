Message Actions box allows the user to flag, edit or delete a message.
There's also a command(`/mute`) for muting the user that wrote the message.

A closed message box

```js
import { MessageActionsBox } from '../components';

const data = require('./data');

<div style={{ position: 'relative' }}>
  <MessageActionsBox
    open={false}
    Message={data.MessageMock}
    getMessageActions={() => []}
    message={data.message}
  />
</div>;
```

An open message box

```js
import { MessageActionsBox } from '../components';

const data = require('./data');

<div style={{ position: 'relative' }}>
  <MessageActionsBox
    open={true}
    Message={data.MessageMock}
    getMessageActions={() => []}
    message={data.message}
  />
</div>;
```
