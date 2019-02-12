Message Actions box allows the user to flag, edit or delete a message.
There's also a shortcut for muting the user that wrote the message.

An open message box

```js
const MessageMock = {
  handleFlag: console.log,
  handleMute: console.log,
  handleEdit: console.log,
  handleDelete: console.log,
};
<div style={{ position: 'relative' }}>
  <MessageActionsBox open={true} Message={MessageMock} />
</div>;
```

A closed message box

```js
const MessageMock = {
  handleFlag: console.log,
  handleMute: console.log,
  handleEdit: console.log,
  handleDelete: console.log,
};
<div style={{ position: 'relative' }}>
  <MessageActionsBox open={false} Message={MessageMock} />
</div>;
```
