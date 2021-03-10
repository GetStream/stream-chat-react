A closed message box:

```js
import { MessageActionsBox } from './MessageActionsBox';

const data = require('../../docs/data');

<div style={{ position: 'relative' }}>
  <MessageActionsBox
    open={false}
    // Message={data.MessageMock}
    getMessageActions={() => ['edit']}
    message={data.message}
  />
</div>;
```

An open message box:

```js
import { MessageActionsBox } from './MessageActionsBox';

const data = require('../../docs/data');

<div style={{ position: 'relative' }}>
  <MessageActionsBox
    open={true}
    // Message={data.MessageMock}
    getMessageActions={() => ['edit', 'delete']}
    message={data.message}
  />
</div>;
```
