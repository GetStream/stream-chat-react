# Official React SDK for [Stream Chat](https://getstream.io/chat/)

<p align="center">
  <a href="https://getstream.io/chat/react-chat/tutorial/"><img src="https://i.imgur.com/SRkDlFX.png" alt="react native chat" width="60%" /></a>
</p>

> The official React components for Stream Chat, a service for
> building chat applications.

[![NPM](https://img.shields.io/npm/v/stream-chat-react.svg)](https://www.npmjs.com/package/stream-chat-react)
[![build](https://github.com/GetStream/stream-chat-react/workflows/test/badge.svg)](https://github.com/GetStream/stream-chat-react/actions)
[![Component Reference](https://img.shields.io/badge/docs-component%20reference-blue.svg)](https://getstream.github.io/stream-chat-react/)
[![codecov](https://codecov.io/gh/GetStream/stream-chat-react/branch/master/graph/badge.svg)](https://codecov.io/gh/GetStream/stream-chat-react)

<img align="right" src="https://getstream.imgix.net/images/chat/chattutorialart@3x.png?auto=format,enhance" width="50%" />

**Quick Links**

- [Register](https://getstream.io/chat/trial/) to get an API key for Stream Chat
- [React Chat Tutorial](https://getstream.io/chat/react-chat/tutorial/)
- [Chat UI Kit](https://getstream.io/chat/ui-kit/)
- [Example Apps](#example-apps)
- [Component Docs](https://getstream.github.io/stream-chat-react/)
- [Internationalization](#internationalization)

With these chat components, you can support any chat use case:

- Livestreams like Twitch or Youtube
- In-Game chat like Overwatch or Fortnite
- Team style chat like Slack
- Messaging style chat like Whatsapp or Facebook's messenger
- Commerce chat like Drift or Intercom

##  React Chat Tutorial

The best place to start is the [React Chat Tutorial](https://getstream.io/chat/react-chat/tutorial/). It teaches you how to use this SDK and also shows how to make frequently required changes.

##  Free for Makers

Stream is free for most side and hobby projects. To qualify your project/company needs to have < 5 team members and < $10k in monthly revenue.
For complete pricing details visit our [Chat Pricing Page](https://getstream.io/chat/pricing/)

## Installation

### Install with NPM

`npm install --save react react-dom stream-chat stream-chat-react`

### Install with Yarn

`yarn add react react-dom stream-chat stream-chat-react`

### Using JS deliver

```
<script src="https://cdn.jsdelivr.net/npm/react@16.13.1/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@16/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/stream-chat"></script>
<script src="https://cdn.jsdelivr.net/npm/stream-chat-react"></script>
```

##  Example Apps

We have built a Social Messenger, Team Collaboration, Customer Support, LiveStream Gaming, and Virtual Event app as examples of what our library can be used for. You can preview these demos online in the [Chat Demos](https://getstream.io/chat/demos/)

## Docs

The [styleguidist docs for stream-chat-react](https://getstream.github.io/stream-chat-react/) document how all the components work.

The React components are created using the [stream-chat-js](https://github.com/getstream/stream-chat-js) library. If you're customizing the components, it's important to learn how the Chat Server API works. You'll want to review our [JS chat API docs](https://getstream.io/chat/docs/js/).

##  TypeScript Support

As of version `5.0.0` `stream-chat-react` has been converted to TypeScript. Please read [Typescript guide](https://github.com/GetStream/stream-chat-react/wiki/Typescript-support) for details.

##  Component Reusability

If a component implements a ton of logic, it's helpful if you split it out into two parts: The top-level component, which handles all the logic, and a lower level component, which handles rendering. That makes it easy to change the rendering without having to touch the other stuff. Have a look at Message and MessageSimple to see how this approach works.

```jsx
<Channel>
  <Window>
    <ChannelHeader />
    <MessageList Message={MessageSimple}/>
    <MessageInput />
  </Window>
  <Thread />
</Channel>
```

###  Customizing Styles

The preferred method for overriding styles from `stream-chat-react` is to import the CSS file into your project in App.js from the dist directory. Then, locate any Stream selectors you want to override using either the browser or by viewing the library code, and then add these to your local CSS file with your styles. For example:

```js
import 'stream-chat-react/dist/css/index.css';
import './App.css';
```

## Internationalization

Please read [Internationalization doc](https://github.com/GetStream/stream-chat-react/wiki/Internationalization-(i18n)) for details.

##  Contributing

We welcome code changes that improve this library or fix a problem. Please make sure to follow all best practices and add tests if applicable before submitting a Pull Request on Github. We are pleased to merge your code into the official repository. Make sure to sign our [Contributor License Agreement (CLA)](https://docs.google.com/forms/d/e/1FAIpQLScFKsKkAJI7mhCr7K9rEIOpqIDThrWxuvxnwUq2XkHyG154vQ/viewform) first. See our license file for more details.

## We are hiring!
We've recently closed a [$38 million Series B funding round](https://techcrunch.com/2021/03/04/stream-raises-38m-as-its-chat-and-activity-feed-apis-power-communications-for-1b-users/) and we keep actively growing.
Our APIs are used by more than a billion end-users, and you'll have a chance to make a huge impact on the product within a team of the strongest engineers all over the world.

Check out our current openings and apply via [Stream's website](https://getstream.io/team/#jobs).
