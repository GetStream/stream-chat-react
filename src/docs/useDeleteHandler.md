A custom hook to handle message deletion.

| Parameter | Type                                                     | Description                |
| --------- | -------------------------------------------------------- | -------------------------- |
| `message` | [object](https://getstream.io/chat/docs/#message_format) | The message to be handled. |

It returns a Promise that takes a mouse event as an argument and handles the trigger of the message deletion + update.

```json
const MyCustomMessageComponent = (props) => {
  const handleDelete = useDeleteHandler(props.message);
  if (props.message.type === 'deleted') {
    return <p>Nothing to see here</p>;
  }
  return (
    <div>
      {props.message.text} <button onClick={handleDelete}>delete</button>
    </div>
  );
};
```
