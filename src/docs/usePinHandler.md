A custom hook to handle message pinning. It provides the permission status of the connected user and a function to toggle pinned status on the message.

| Parameter                            | Type                                                     | Description                                                     |
| ------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------- |
| `message`                            | [object](https://getstream.io/chat/docs/javascript/message_format/?language=javascript) | The message to be handled       |
| `permissions`                        | object                                                   | The user roles allowed to pin messages in various channel types |
| `notifications`                      | object                                                   | An object containing the following properties:                  |
| `notifications.notify`               | func                                                     | A function that adds notification text to message               |
| `notifications.getErrorNotification` | func                                                     | A function that returns an error message                        |

It returns the following object:

| Parameter   | Type    | Description                                        |
| ----------- | ------- | -------------------------------------------------- |
| `canPin`    | boolean | Whether or not the connected user can pin messages |
| `handlePin` | func    | Function to toggle the pinned status of a message  |

```json
import { usePinHandler } from 'stream-chat-react';
const MyCustomMessageComponent = (props) => {
  const { addNotification, getPinMessageErrorNotification, message, pinPermissions } = props;
  const { canPin, handlePin } = usePinHandler(message, pinPermissions, {
    notify: addNotification,
    getErrorNotification: getPinMessageErrorNotification,
  });
  const handleClick = () => {
    if (canPin) handlePin(message);
  }
  return (
    <div className={message.pinned ? 'pinned' : ''} onClick={handleClick}>
      <p>{message.text}</p>
    </div>
  );
};
```
