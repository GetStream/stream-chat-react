# React Chat Components

<a href="https://getstream.io/chat/react-chat/tutorial/"><img src="https://i.imgur.com/SRkDlFX.png" alt="react native chat" /></a>

> The official React components for Stream Chat, a service for
> building chat applications.

[![NPM](https://img.shields.io/npm/v/stream-chat-react.svg)](https://www.npmjs.com/package/stream-chat-react)
[![Build Status](https://travis-ci.org/GetStream/stream-chat-react.svg?branch=master)](https://travis-ci.org/GetStream/stream-chat-react)
[![Component Reference](https://img.shields.io/badge/docs-component%20reference-blue.svg)](https://getstream.github.io/stream-chat-react/)

**Quick Links**

- [Register](https://getstream.io/chat/trial/) to get an API key for Stream Chat
- [React Chat Tutorial](https://getstream.io/chat/react-chat/tutorial/)
- [Chat UI Kit](https://getstream.io/chat/ui-kit/)

With these chat components you can support any type of chat use case:

- Livestreams like Twitch or Youtube
- In-Game chat like Overwatch or Fortnite
- Team style chat like Slack
- Messaging style chat like Whatsapp or Facebook's messenger
- Commerce chat like Drift or Intercom

## React Chat Tutorial

The best place to start is the [React Chat Tutorial](https://getstream.io/chat/react-chat/tutorial/). It teaches you how to use this SDK and also shows how to make common changes.

## Example Apps

This repo includes 4 example apps. You can try them out like this:

```
git clone git@github.com:GetStream/stream-chat-react.git
cd examples
cd messaging
yarn
yarn start
```

The 4 examples are `messaging`, `team`, `commerce` and `livestream`. You can also preview these demos online in the [Chat Demos](https://getstream.io/chat/demos/)

## Docs

The [styleguidist docs for stream-chat-react](https://getstream.github.io/stream-chat-react/) document how all the components work.

The React components are created using the stream-chat-js library. If you're customizing the components it's important to learn how the Chat Server API works. You'll want to review our [JS chat API docs](https://getstream.io/chat/docs/js/).

## Commands

- yarn docs-server
- yarn lint-fix
- yarn lint

## Component Reusability

1.  If a component implements a ton of logic it's nice if you split it out into 2 Components
    The top level component which handles all the logic, and a lower level component which just handles rendering.
    This makes it easy to change the rendering without having to touch the other stuff.
    Have a look at Message and MessageTeam to see how this approach works.

2.  Make things configurable via the props where possible. Sometimes an even better approach is to use the props.children approach.
    Have a look at how flexible the channel layout is due to this approach:

```jsx
<Channel>
  <Window>
    <ChannelHeader type="Team" />
    <MessageList />
    <MessageInput />
  </Window>
  <Thread />
</Channel>
```

### Customizing styles

`stream-chat-react` uses scss for styling. There may be times when you want to make simple changes to our stylesheets and don't want to manually override classes and styles. To make these customizations you can do the following:

- Clone this repository
- Make the changes you want in the scss files
- Run `yarn build-styles` or `yarn watch-styles`

## Performance

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

## Contributing

We welcome code changes that improve this library or fix a problem, please make sure to follow all best practices and add tests if applicable before submitting a Pull Request on Github. We are very happy to merge your code in the official repository. Make sure to sign our [Contributor License Agreement (CLA)](https://docs.google.com/forms/d/e/1FAIpQLScFKsKkAJI7mhCr7K9rEIOpqIDThrWxuvxnwUq2XkHyG154vQ/viewform) first. See our license file for more details.
