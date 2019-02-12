The MessageInput is a higher level component that has provides all functionality to the Input it renders. In this example it renders the default component MessageInputLarge.

```js
const data = require('./data');
<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client} Message={MessageTeam}>
    <Channel channel={data.channel}>
      <MessageInput focus />
    </Channel>
  </Chat>
</div>;
```
