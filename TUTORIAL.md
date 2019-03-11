## Chat with React tutorial

This tutorial shows you how to quickly build chat leveraging Stream's API and the Chat React component.
The underlying API is very flexible and allows you to build any type of chat.
Examples of what you can build include:

- Customer support chat
- Chat for a livestream
- In-game chat
- IRC/Slack style chat
- A messaging app like WhatsApp or Messenger

## Setup

The easiest way to follow this tutorial is to create a fresh project using the `create-react-app` script

Make sure that you have a recent version of Node (>10) and Yarn installed.

```
yarn global add create-react-app
```

Run the following commands to create a new React Native project called `ChatExample`

```
create-react-app ChatExample
cd ChatExample
yarn add stream-chat-react
```

This will create the skeleton of the project and install the Stream Chat Components.

## Types of Chat

The first part of this tutorial shows you how to build a WhatsApp/Messenger style chat.
The second part shows how to build chat for a livestream.

## Part 1 - WhatsApp/Messenger style Chat with React

### A. Message List & RichTextInput

The core of the Chat UI is the message list component. Let's initialize the
connection to Stream and configure the message component.

```jsx
import React from 'react';
import {
  StreamChat,
  Channel,
  MessageList,
  RichTextInput,
} from 'stream-chat-react';

const chatClient = new StreamChat('app_id__key');
chatClient.setUser(
  'user id',
  {
    // custom fields
    name: 'user name',
    status: 'busy',
    image: 'myimageurl',
  },
  'myusertoken',
);
const channel = chatClient.channel('test', 'random', {
  // add as many custom fields as you'd like
  image:
    'https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_01_green.jpg',
  name: 'The random channel',
});

const App = () => (
  <StreamChat client={chatClient}>
    <Channel channel={channel}>
      <ChannelHeader />
      <MessageList />
      <RichTextInput />
    </Channel>
  </StreamChat>
);

export default App;
```

Note how we're creating the `channel('test', 'random')` channel.
The first argument is the group name and the second argument the chat ID.
The group name allows you to configure a common set of settings for your chat.
The chat id is a unique reference to this specific channel.

These 7 lines of code:

```jsx
<StreamChat client={chatClient}>
  <Channel channel={channel}>
    <ChannelHeader />
    <MessageList />
    <RichTextInput />
  </Channel>
</StreamChat>
```

Setup a fully functional chat UI. Out of the box you'll notice that the following features are enabled:

- URL enrichment (Try sending a message with a URL to see this in action)
- Video & YouTube support
- File uploads & Previews
- /commands such as /giphy and /ban. You can also implement your own slash commands to make your team more productive.
- Presence/Who is online
- Typing indicators
- Message status indicators (sending, received)
- Automatic AI powered spam & profanity protection
- Moderators and user roles
- Emoticons
- Read indicators

## B. Channel List

For customer support, Slack or WhatsApp style chat you'll want to show a little preview of many channels at once.
The example below shows how to use the ChannelList component:

```jsx
import React from 'react';
import { StreamApp } from 'stream-chat-react';

const chatClient = new StreamChat('app_id__key', 'edge');
chatClient.setUser(
  'user id',
  {
    // custom fields
    name: 'user name',
    status: 'busy',
    image: 'myimageurl',
  },
  'myusertoken',
);

export default class App extends React.Component {
  async onComponentDidMount() {
    const filter = { members: { $contains: ['thierry'] } };
    const sort = { last_message_at: -1 };

    this.setState({ channels: await authClient.queryChannels(filter, sort) });
  }

  render() {
    return (
      <StreamApp client={chatClient}>
        <ChannelList channels={channels} />
        <Channel>
          <ChannelHeader />
          <MessageList />
          <RichTextInput />
        </Channel>
      </StreamApp>
    );
  }
}
```

Note that `ChannelList` will automatically set the `channel` property of the `Channel` component.

### C. Customizing the component

Customizing the React components is easy. The example below shows how
to change the Message component and the ChannelPreview component.

```jsx
class MyChannelPreview extends Component {
  render() {
    return (
      <div className="channel_preview">
        <a href="" onClick={this.props.setActiveChannel.bind(this, c)}>
          {name}
        </a>

        <span className={unreadClass}>
          {lastMessageText}
          Unread Count: {this.state.unread}
        </span>
      </div>
    );
  }
}

class MyMessage extends Component {
  render() {
    return <div>{this.props.message.text}</div>;
  }
}

const App = () => (
  <StreamApp client={chatClient}>
    <ChannelList channels={channels} Preview={MyChannelPreview} />
    <Channel>
      <ChannelHeader />
      <MessageList Message={MyMessage} />
      <RichTextInput />
    </Channel>
  </StreamApp>
);

export default App;
```

## Step 2: Live Stream Chat example with React

### A. A basic Live Stream

There are a few differences when building chat for a livestream:

- The user interface is typically more compact
- Typing and message read states get too noisy

Have a look at the example below for building a livestream chat:

```jsx
import React from 'react';
import { StreamChat, Channel, MessageList } from 'stream-chat-react';

const chatClient = new StreamChat('app_id__key');
chatClient.setGuestUser({ name: 'george' });
const channel = chatClient.channel('livestream', 'spacex');

const App = () => (
  <StreamChat client={chatClient}>
    <Channel channel={channel}>
      <ChannelHeader />
      <MessageList />
      <CompactRichTextInput />
    </Channel>
  </StreamChat>
);

export default App;
```

Note a few differences with the first example:

- We're using the `livestream` config group. This config group disables typing and read states.
- The `<CompactRichTextInput />` takes up less space. You can still use :emoticons: and other rich text input features
- We create a guest user with the name George `chatClient.setGuestUser({name: "george"})`

### B. Components with Context

This library uses the react context system to pass around shared context. One example is information about the channel you've selected.
In the above example you see how the `ChannelHeader`, `MessageList` and `CompactRichTextInput` are all aware of the current channel.

The example below shows you how to build your own `ChannelFooter` component.

```jsx
class ChannelFooter extends PureComponent {
  render() {
    return (
      <div className="chat-footer">
        Currently there are {this.props.online} people in the{' '}
        {this.props.channel.custom.name} channel!
      </div>
    );
  }
}

// Magic: add the channel context so props.online and props.channel.custom.name are available
ChannelFooter = withChannelContext(ChannelFooter);

const App = () => (
  <StreamChat client={chatClient}>
    <Channel channel={channel}>
      <MessageList />
      <CompactRichTextInput />
      <ChannelFooter />
    </Channel>
  </StreamChat>
);

export default App;
```

### C. Custom message types

The chat API allows you to store custom data for users, messages, events, channels and attachments.
This allows you to customize the chat exactly how you want.
Lets say that you want to show a list of products in a chat message.

We'll do this by supporting a custom `product` message attachment.

```jsx
import { Attachment } from 'stream-chat-react';

class MyAttachment extends PureComponent {
  render() {
    const a = this.props.attachment;
    if (a.type === 'product') {
      return (
        <div className="product">
          <span>
            <img src="{this.props.attachment.image}" />
            {this.props.attachment.name}
          </span>
        </div>
      );
    } else {
      return <Attachment {...this.props} />;
    }
  }
}

const App = () => (
  <StreamChat client={chatClient}>
    <Channel channel={channel}>
      <MessageList Attachment={MyAttachment} />
      <CompactRichTextInput />
      <ChannelFooter />
    </Channel>
  </StreamChat>
);

export default App;
```

To create a message with the custom attachment:

```js
const attachments = [{ type: 'product', name: 'iPhone', image: 'myimgurl' }];
channel.sendMessage({
  text:
    'Your selected product is out of stock, would you like to select one of these alternatives?',
  attachments,
});
```

## Conclusion

We hope you enjoyed this tutorial. Using these components you can get chat up and running for your app in minutes.

To learn more about the underlying REST API read the Node SDK client docs:
TODO: LINKHERE

For the Component API docs visit this link:

TODO: LINK

With the components and the underlyng API you can build any type of chat.
If you have a use case that doesn't quite seem to fit please <link here>let us know</link here/>.
Also feel free to reach out if you have any questions or feedback.
