A custom hook to give you access to the message user.

| Parameter                 | Type                                                     | Description                                                                                                                     |
| ------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `message`                 | [object](https://getstream.io/chat/docs/#message_format) | The message to be handled.                                                                                                      |
| `opts`                    | object                                                   | An object containing the following properties.                                                                                  |
| `opts.onUserClickHandler` | func                                                     | A function to handle the user click. Will be called with the user click event and the current message user object as arguments. |
| `opts.onUserHoverHandler` | func                                                     | A function to handle the user hover. Will be called with the user hover event and the current message user object as arguments. |

It returns and object containing the event handlers for mentions.

| Returns                | Type   | Description                                                                                     |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `handlers`             | object | An object containing the event handlers for getting a message user.                             |
| `handlers.onUserClick` | func   | An event handler tied to the set user click handler. It takes a mouse event as its argument.    |
| `handlers.onUserHover` | func   | An event handler tied to the set mention hover handler. It takes a mouse event as its argument. |

```json
import { useUserHandler } from '../components';
const MyCustomMessageComponent = (props) => {
  const { onUserClick, onUserHover } = useUserHandler(props.message, {
    onUserClickHandler: (e, user) => console.log(`Message from ${user}`),
    onUserHoverHandler: (e, user) => console.log(`Message from ${user}`),
  });
  return (
    <div onClick={onUserClick} onHover={onUserHover}>
      {props.message.text}
    </div>
  );
};
```
