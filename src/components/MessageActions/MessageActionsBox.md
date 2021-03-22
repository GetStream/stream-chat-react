An open message box:

```js
import { MessageActionsBox } from './MessageActionsBox';

const data = require('../../docs/data');

<div style={{ position: 'relative' }}>
  <MessageActionsBox
    open={true}
    Message={data.MessageMock}
    getMessageActions={() => ['edit', 'delete']}
    message={data.message}
  />
</div>;
```
