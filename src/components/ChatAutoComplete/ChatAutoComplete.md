```js
import { Channel } from '../Channel/Channel';
import { Chat } from '../Chat/Chat';
import { ChatAutoComplete } from './ChatAutoComplete';
import { MessageInput } from '../MessageInput';
const data = require('../../docs/data')

const AutocompleteWithProps = () => {
  return <ChatAutoComplete rows={3} grow placeholder={'Type something...'} />
}

const AutocompleteWithContext = () => {
  return <MessageInput Input={AutocompleteWithProps} />
}

<Chat client={data.client}>
  <Channel channel={data.channel}>
    <AutocompleteWithContext />
  </Channel>
</Chat>
```
