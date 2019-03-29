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

### Overriding Upload Logic

If you want to upload files and images to your own server you can override our upload logic with two props on MessageInput:

- `onFileUploadRequest(file, channel)`
- `onImageUploadRequest(file, channel)`

Both functions have access to the selected file and the channel object and expect an object to be returned `{file: url}`.
