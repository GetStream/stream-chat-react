```js
import { Message } from './Message';
import { MessageSimple } from './MessageSimple';
import { Channel } from '../../components/Channel/Channel'
import { Chat } from '../../components/Chat/Chat'
import { MessageContextValue, MessageProvider } from '../../context/MessageContext';

const data = require('../../docs/data');
<div className="str-chat" style={{ height: 'unset' }}>
<Chat client={data.client}>
  <Channel channel={data.channel} Message={MessageSimple}>
    <Message
      message={data.message}  
      readBy={[]}
      groupStyles={['top']}
      editing={false}
      mutes={[]}
      {...data.channelContext}
      {...data.translationContext}
    />
  </Channel>
</Chat>
</div>;
```