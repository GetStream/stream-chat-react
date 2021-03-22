```js
import { ChannelPreviewMessenger } from './ChannelPreviewMessenger';
import { Chat } from '../';
import { ChannelList } from '../ChannelList/ChannelList';

const data = require('../../docs/data');
const filters = { type: 'team' };
const sort = {
  last_message_at: -1,
};
const options = {
  watch: true,
  limit: 3,
};
console.log('data in the', data);
<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client}>
    <ChannelList
      Preview={ChannelPreviewMessenger}
      filters={filters}
      options={options}
      sort={sort}
    />
  </Chat>
</div>;
```
