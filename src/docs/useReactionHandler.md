A custom hook to handle the message reactions.

| Parameter | Type                                                     | Description                |
| --------- | -------------------------------------------------------- | -------------------------- |
| `message` | [object](https://getstream.io/chat/docs/#message_format) | The message to be handled. |

It returns an event handler for opening threads.

| Returns   | Type | Description                                                                          |
| --------- | ---- | ------------------------------------------------------------------------------------ |
| `handler` | func | A function that receives a reaction type (string) and user click event as arguments. |

```json
import { useReactionHandler } from '../components';
const MyCustomMessageComponent = (props) => {
  const onReactionClick = useReactionHandler(props.message)
  return (
    <div>
      {props.message.text}
      <button onClick={(e) => onReactionClick('nice', e)}>Nice!</button>
      <button onClick={(e) => onReactionClick('not-nice', e)}>I don't like it!</button>
    </div>
  );
};
`
```
