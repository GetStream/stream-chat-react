A custom hook to handle send message retrying.

| Parameter                | Type | Description                                                                                |
| ------------------------ | ---- | ------------------------------------------------------------------------------------------ |
| `customRetrySendMessage` | func | A function that overrides the default retry send message handler from the channel context. |

It returns a message retry handler.

| Returns   | Type | Description                                                |
| --------- | ---- | ---------------------------------------------------------- |
| `handler` | func | A function that receives the message object to be retried. |

```json
import { useRetryHandler } from '../components';
const MyCustomMessageComponent = (props) => {
  const retrySend = useRetryHandler();
  if (props.message.status === 'failed') {
    const onRetry = () => retrySend(props.message);
    return (
      <div>
        Failed to send: {props.message.text}
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  }
  return (
    <div>
      {props.message.text}
    </div>
  );
};
`
```
