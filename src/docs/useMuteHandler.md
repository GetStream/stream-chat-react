A custom hook to handle muting users. It will provide you with an event handler that processes user muting for you.

| Parameter                     | Type                                                     | Description                                                                                                                                                                                                                                                |
| ----------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`                     | [object](https://getstream.io/chat/docs/#message_format) | The message to be handled.                                                                                                                                                                                                                                 |
| `opts`                        | object                                                   | An object containing the following properties.                                                                                                                                                                                                             |
| `opts.notify`                 | func                                                     | A function that will be passed a notification text and a type as arguments. It is intended as a way to handle the display of the notification on the component that is wrapping your messages, usually the message list. Type can be 'success' or 'error'. |
| `opts.getErrorNotification`   | func                                                     | A function that will be called when displaying an 'error' notification. It will be passed a message object as argument, and must return a string.                                                                                                          |
| `opts.getSuccessNotification` | func                                                     | A function that will be called when displaying an 'success' notification. It will be passed a message object as argument, and must return a string.                                                                                                        |

It returns an async mouse event handler.

```json
import { useMuteHandler } from '../components';
const MyCustomMessageComponent = (props) => {
  const handleMute = useMuteHandler(props.message, { notify: props.addNotification })
  return (
    <div>
      {props.message.text} <button onClick={handleMute}>Mute the user that sent this!</button>
    </div>
  );
};
`
```
