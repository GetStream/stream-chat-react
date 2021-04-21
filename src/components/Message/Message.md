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

Use the team messaging render component and set readBy

```js
import { Message } from './Message';
import { MessageTeam } from './MessageTeam';
import { Channel }from '../../components/Channel'
import { Chat }from '../../components/Chat'

const data = require('../../docs/data');

const readBy = [
  {
    created_at: '2019-03-11T15:13:05.441436Z',
    id: 'Jaapusenameinsteadplz',
    image:
      'https://www.gettyimages.com/gi-resources/images/CreativeLandingPage/HP_Sept_24_2018/CR3_GettyImages-159018836.jpg',
    last_active: '2019-04-02T11:11:13.188618462Z',
    name: 'Jaap',
    online: true,
    updated_at: '2019-04-02T11:11:09.36867Z',
  },
];
<Chat client={data.client}>
  <Channel channel={data.channel} Message={MessageTeam}>
    <Message
      message={data.message}    
      readBy={readBy}
      groupStyles={['single']}
      editing={false}
      mutes={[]}
      {...data.channelContext}
      {...data.translationContext}
    />
  </Channel>
</Chat>    
```
