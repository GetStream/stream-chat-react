The default circle style Avatar

```js
import { Avatar } from '../components/Avatar';
const image =
  'https://pbs.twimg.com/profile_images/897621870069112832/dFGq6aiE_400x400.jpg';
const name = 'uthred';

<Avatar image={image} name={name} shape={'circle'} size={35} />;
```

A rounded Avatar

```js
import { Avatar } from '../components';
const image =
  'https://pbs.twimg.com/profile_images/897621870069112832/dFGq6aiE_400x400.jpg';
const name = 'uthred';

<Avatar image={image} name={name} shape={'rounded'} size={35} />;
```

And a square variation

```js
import { Avatar } from '../components';
const image =
  'https://pbs.twimg.com/profile_images/897621870069112832/dFGq6aiE_400x400.jpg';
const name = 'uthred';

<Avatar image={image} name={name} shape={'square'} size={35} />;
```

An example of how the fallback looks

```js
import { Avatar } from '../components';
const name = 'username';

<Avatar name={name} shape={'circle'} size={35} />;
```
