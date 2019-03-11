The Message component is the high level component that deals with all the message logic.
It doesn't implement any rendering, but delegates that to the Message prop.

```js
const data = require('./data');
<div className="str-chat" style={{ height: 'unset' }}>
  <Message
    message={data.message}
    Message={MessageSimple}
    readBy={[]}
    groupStyles={['top']}
    editing={false}
    {...data.channelContext}
  />
</div>;
```

Use the team messaging render component and set readBy

```js
const data = require('./data');

const readBy = [
  {
    created_at: '2019-01-22T16:35:18.417456Z',
    id: 'thierry',
    online: true,
    role: 'user',
    updated_at: '2019-01-25T18:07:04.20131Z',
  },
];

<Message
  message={data.message}
  Message={MessageTeam}
  readBy={readBy}
  groupStyles={['bottom']}
  editing={false}
  {...data.channelContext}
/>;
```
