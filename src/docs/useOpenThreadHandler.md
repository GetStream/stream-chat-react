A custom hook to handle the opening of a thread in the current channel.

| Parameter          | Type                                                     | Description                                                                                                                                                             |
| ------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`          | [object](https://getstream.io/chat/docs/#message_format) | The message to be handled.                                                                                                                                              |
| `customOpenThread` | func                                                     | A function that takes a message object and a user UI event, that can be used to customize how you handle thread opening, by overriding the default open thread handler. |

It returns an event handler for opening threads.

| Returns   | Type | Description                                           |
| --------- | ---- | ----------------------------------------------------- |
| `handler` | func | A function that receives a user UI event as argument. |

```json
import { useOpenThreadHandler } from '../components';
const MyCustomMessageComponent = (props) => {
  const onThreadClick = useOpenThreadHandler(props.message)
  return (
    <div>
      {props.message.text}
      <button onClick={onThreadClick}>Reply</button>
    </div>
  );
};
`
```
