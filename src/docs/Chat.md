Team Style Example

```jsx
import {
  Chat,
  Channel,
  MessageTeam,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
} from '../components';

const StreamChat = require('stream-chat').StreamChat;

chatClient = new StreamChat('qk4nn7rpcn75');

chatClient.setUser(
  {
    id: 'John',
  },
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiSm9obiIsImlhdCI6MTU0ODI5ODUxN30.hyonbQnOLuFsr15mdmc_JF4sBOm2SURK4eBvTOx3ZIg',
);

const channel = chatClient.channel('team', 'docs', {
  image:
    'https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_01_green.jpg',
  name: 'Talk about the documentation',
});

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={chatClient}>
    <Channel channel={channel} Message={MessageTeam}>
      <div className="str-chat__main-panel" style={{ height: '500px' }}>
        <ChannelHeader type="Team" />
        <MessageList />
        <MessageInput />
      </div>
      <Thread autoFocus={false} />
    </Channel>
  </Chat>
</div>;
```

**NOTE** The Chat produces the [ChatContext](#chatcontext) and exposes a [withChatContext](#withchatcontext) HOC.

If you want to write your own component which consumes the chat context, have a look at the example below:

```json

class DemoComponent extends React.PureComponent {
  render() {
    return (
      <ol>
        <li>UserID: {this.props.client.userID}</li>
        <li>Active Channel: {this.props.channel.cid}</li>
      </ol>
    );
  }
}

const MyContextAwareComponent = ChatComponents.withChatContext(
  DemoComponent,
);

<div className="str-chat" style={{ height: 'unset' }}>
  <Chat client={data.client} Message={MessageTeam}>
    <MyContextAwareComponent />
  </Chat>
</div>;
```
