A custom hook to give you quick access to message mentions.

| Parameter              | Type                                                     | Description                                                                                                                                       |
| ---------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`              | [object](https://getstream.io/chat/docs/#message_format) | The message to be handled.                                                                                                                        |
| `opts`                 | object                                                   | An object containing the following properties.                                                                                                    |
| `opts.onMentionsClick` | func                                                     | A function to overwrite the default channel mention handler. It will be called with the user event as the first argument and                      |
| `opts.onMentionsHover` | func                                                     | A function that will be called when displaying an 'error' notification. It will be passed a message object as argument, and must return a string. |

It returns and object containing the event handlers for mentions.

| Returns                    | Type   | Description                                                                                     |
| -------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `handlers`                 | object | An object containing the event handlers for mentions.                                           |
| `handlers.onMentionsClick` | func   | An event handler tied to the set mention click handler. It takes a mouse event as its argument. |
| `handlers.onMentionsHover` | func   | An event handler tied to the set mention hover handler. It takes a mouse event as its argument. |

```json
import { useMentionsHandler } from '../components';
const MyCustomMessageComponent = (props) => {
  const { onMentionsClick, onMentionsHover } = useMentionsHandler(props.message)
  return (
    <div onClick={onMentionsClick} onHover={onMentionsHover}>
      {props.message.text}
    </div>
  );
};
```
