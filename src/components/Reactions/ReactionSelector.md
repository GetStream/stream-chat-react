```js
import { ReactionSelector } from './ReactionSelector';

function handleReaction(reaction) {
  console.log('reaction', reaction);
}
<div className="str-chat" style={{ height: '100px' }}>
  <ReactionSelector
    detailedView={true}
    handleReaction={handleReaction}
  />
</div>;
```
