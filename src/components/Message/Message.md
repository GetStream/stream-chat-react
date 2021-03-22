```js
import { Message } from './Message';
import { MessageSimple } from './MessageSimple';

const data = require('../../docs/data');
<div className="str-chat" style={{ height: 'unset' }}>
  <Message
    message={data.message}
    Message={MessageSimple}
    readBy={[]}
    groupStyles={['top']}
    editing={false}
    mutes={[]}
    {...data.channelContext}
    {...data.translationContext}
  />
</div>;
```

Use the team messaging render component and set readBy

```js
import { Message } from './Message';
import { MessageTeam } from './MessageTeam';

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

<Message
  message={data.message}
  Message={MessageTeam}
  readBy={readBy}
  groupStyles={['single']}
  editing={false}
  mutes={[]}
  {...data.channelContext}
  {...data.translationContext}
/>;
```
