A custom hook to handle message edition. It will provide you with an editing state flag as well as handlers for setting
and clearing it.

| Parameter      | Type    | Description                       |
| -------------- | ------- | --------------------------------- |
| `initialState` | boolean | The initial message editing state |

It returns the following object:

| Parameter   | Type    | Description                                                                                                   |
| ----------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| `editing`   | boolean | The current message editing state                                                                             |
| `setEdit`   | func    | Receives a mouse event as a parameter. A function to handle user actions that sets the message edit mode.     |
| `clearEdit` | func    | Receives a mouse event as a parameter. A function to handle user actions that clears the message's edit mode. |

```json
import { useEditHandler } from '../components';
const MyCustomMessageComponent = (props) => {
  const { editing, setEdit, clearEdit } = useEditHandler();
  if (editing) {
    return <div>Editing: {props.message.text} <button onClick={clearEdit}>Cancel</button></div>
  }
  return (
    <div>
      {props.message.text} <button [onClick](onClick)={setEdit}>Edit</button>
    </div>
  );
};
```
