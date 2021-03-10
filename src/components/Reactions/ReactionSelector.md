```js
import { ReactionSelector } from './ReactionSelector';

function handleReaction(reaction) {
  console.log('reaction', reaction);
}
<div>
  <ReactionSelector
    detailedView={true}
    handleReaction={handleReaction}
  />
</div>;
```
