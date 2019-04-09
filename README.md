## React Chat Components

With these chat components you can support any type of chat use case:

- Livestreams like Twitch or Youtube
- In-Game chat like Overwatch or Fortnite
- Team style chat like Slack
- Messaging style chat like Whatsapp or Facebook's messenger
- Commerce chat like Drift or Intercom

### React Chat Tutorial & Docs

The best place to start is the React Chat Tutorial

You'll also want to review the React Chat Component Documentation.

If you're customizing the components it's important to learn how the Chat Server API works.
You can read about that in the Chat API docs.

## Development & Contributing

### Commands

- yarn docs-server
- yarn lint-fix
- yarn lint

### Component Reusability

1.  If a component implements a ton of logic it's nice if you split it out into 2 Components
    The top level component which handles all the logic, and a lower level component which just handles rendering.
    This makes it easy to change the rendering without having to touch the other stuff.
    Have a look at Message and MessageTeam to see how this approach works.

2.  Make things configurable via the props where possible. Sometimes an even better approach is to use the props.children approach.
    Have a look at how flexible the channel layout is due to this approach:

```js
<Channel>
  <Window>
    <ChannelHeader type="Team" />
    <MessageList />
    <MessageInput />
  </Window>
  <Thread />
</Channel>
```

### Performance

Since chat can get pretty active it's important to pay attention to performance.
For every component either:

- Implement shouldComponentUpdate
- Extend PureComponent

You can verify if the update behaviour is correct by sticking this code in your component:

```js
import React from 'react';
import diff from 'shallow-diff';

export default class MyComponent extends React.Component {
  shouldComponentUpdate(nextProps) {
    console.log(diff(this.props, nextProps));
  }
}
```

Note that the PureComponent uses a shallow diff to determine if a component should rerender upon state change.
The regular Component simply always rerenders when there is a state change.

You can read more about PureComponents and common gotchas here:
https://codeburst.io/when-to-use-component-or-purecomponent-a60cfad01a81

You want the shallow diff to only be true if something actually changed.
Common mistakes that hurt performance are:

- Mistake: Passing anonymous functions (those are different every time)
- Solution: Use a regular function
- Mistake: Passing an object {} or an array [] that's not using seamless-immutable
- Solution: Use an immutable type (ie a number or a string) or use a seamless immutable version of an object or an array
