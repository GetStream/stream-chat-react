```js
import { ChatAutoComplete } from './ChatAutoComplete';
import { MessageInput } from '../MessageInput';

const AutocompleteWithProps = () => {
  return <ChatAutoComplete rows={3} grow placeholder={'Type something...'} />
}

const AutocompleteWithContext = () => {
  return <MessageInput Input={AutocompleteWithProps} />
}

<div className="str-chat" style={{ height: 'unset' }}>
  <AutocompleteWithContext />
</div>;
```
