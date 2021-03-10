```js
import { ChannelPreviewCompact } from './ChannelPreviewCompact';
import { Chat } from '../';
import { ChannelList } from '../ChannelList/ChannelList';

const data = require('../../docs/data');
const filters = { type: 'team' };
const sort = {
  last_message_at: -1,
  cid: 1,
};
const options = {
  member: true,
  watch: true,
  limit: 3,
};
<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client}>
    <ChannelList
      Preview={ChannelPreviewCompact}
      filters={filters}
      options={options}
      sort={sort}
    />
  </Chat>
</div>;
```
