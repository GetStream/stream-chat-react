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
- [Internationalisation](#internationalisation)

With these chat components, you can support any chat use case:

- Livestreams like Twitch or Youtube
- In-Game chat like Overwatch or Fortnite
- Team style chat like Slack
- Messaging style chat like Whatsapp or Facebook's messenger
- Commerce chat like Drift or Intercom

## React Chat Tutorial

The best place to start is the [React Chat Tutorial](https://getstream.io/chat/react-chat/tutorial/). It teaches you how to use this SDK and also shows how to make frequently required changes.

## Free for Makers

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

## Example Apps

This repo includes 4 example apps. You can try them out like this:

```
git clone git@github.com:GetStream/stream-chat-react.git
cd examples/messaging
yarn
yarn start
```

The four examples are `messaging`, `team`, `commerce` and `livestream`. You can also preview these demos online in the [Chat Demos](https://getstream.io/chat/demos/)

## Docs

The [styleguidist docs for stream-chat-react](https://getstream.github.io/stream-chat-react/) document how all the components work.

The React components are created using the [stream-chat-js](https://github.com/getstream/stream-chat-js) library. If you're customizing the components, it's important to learn how the Chat Server API works. You'll want to review our [JS chat API docs](https://getstream.io/chat/docs/js/).

## Typescript

**Note:** The [stream-chat-js](https://github.com/getstream/stream-chat-js) library allows for fully typed responses using generics, currently the React SDK does not allow for user defined types via generics, so custom fields will be returned with type `unknown` and need to be ignored using `@ts-ignore` when using custom components in typescript.

## Commands

- yarn docs-server
- yarn lint-fix
- yarn lint

## Component Reusability

1. If a component implements a ton of logic, it's helpful if you split it out into two parts: The top-level component, which handles all the logic, and a lower level component, which handles rendering. That makes it easy to change the rendering without having to touch the other stuff. Have a look at Message and MessageTeam to see how this approach works.

2. Make things configurable via the props where possible. Sometimes an even better approach is to use the props.children. Have a look at how flexible the channel layout is due to this approach:

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

The preferred method for overriding styles from `stream-chat-react` is to import the CSS file into your project in App.js from the dist directory. Then, locate any Stream selectors you want to override using either the browser or by viewing the library code, and then add these to your local CSS file with your styles. For example:

```js
import 'stream-chat-react/dist/css/index.css';
import './App.css';
```

Alternatively, there may be times when you want to make simple changes to our stylesheets and don't want to override classes and styles manually. To make these customizations, you can do the following:

- Clone this repository
- Make the changes you want in the SCSS files
- Run `yarn build-styles` or `yarn watch-styles`

As another alternative option if you're also using SCSS for styling, you can import component styles directly in your .scss files. For example:

```scss
// customChatDownComponent.scss
@import 'node_modules/stream-chat-react/dist/scss/ChatDown.scss';

.myCustomChatDown {
  background: rgba(blue, 0.7);
}
```

Depending on your build system configuration, you might have issues importing SCSS files that require images from our provided assets. For example, if you're using `create-react-app` and you try to introduce one of those SCSS files, you'll see an error telling you that `Relative imports outside of src/ are not supported.`

You can work around this kind of issue by overwriting the `$assetsPath` variable and making sure you provide the necessary assets accordingly:

```scss
@import 'node_modules/stream-chat-react/dist/scss/_variables.scss';
$assetsPath: '/img'; // This will make url(..) calls compiles to url('/img/<asset-name>.png').
@import 'node_modules/stream-chat-react/dist/scss/index.scss';
```

## Performance

Since chat can get pretty active, it's essential to pay attention to performance.
For every component either:

- Implement shouldComponentUpdate
- Extend PureComponent

You can verify if the update behavior is correct by sticking this code in your component:

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
The regular component simply always rerenders when there is a state change.

You can read more about PureComponents and common gotchas here:
<https://codeburst.io/when-to-use-component-or-purecomponent-a60cfad01a81>

You want the shallow diff only to be true if something changed.
Common mistakes that hurt performance are:

- Mistake: Passing anonymous functions (those are different every time)
- Solution: Use a regular function
- Mistake: Passing an object {} or an array [] that's not using seamless-immutable
- Solution: Use an immutable type (i.e., a number or a string) or use a seamless immutable version of an object or an array

## Internationalisation

Instance of class `Streami18n` should be provided to the Chat component to handle translations.
Stream provides the following list of in-built translations for components:

1. English (en)
2. Dutch (nl)
3. Russian (ru)
4. Turkish (tr)
5. French (fr)
6. Italian (it)
7. Hindi (hi)

The default language is English. The simplest way to start using chat components in one of the in-built languages would be the following:

Simplest way to start using chat components in one of the in-built languages would be following:

```js static
const i18n = new Streami18n({ language: 'nl' });
<Chat client={chatClient} i18nInstance={i18n}>
  ...
</Chat>;
```

If you would like to override certain keys in in-built translation:

```js static
const i18n = new Streami18n({
  language: 'nl',
  translationsForLanguage: {
    'Nothing yet...': 'Nog Niet ...',
    '{{ firstUser }} and {{ secondUser }} are typing...':
      '{{ firstUser }} en {{ secondUser }} zijn aan het typen...',
  },
});
```

You can find all the available keys here: <https://github.com/GetStream/stream-chat-react/tree/master/src/i18n>

They are also exported as a JSON object from the library.

```js static
import {
  enTranslations,
  nlTranslations,
  ruTranslations,
  trTranslations,
  frTranslations,
  hiTranslations,
  itTranslations,
  esTranslations,
} from 'stream-chat-react';
```

Please read this docs on i18n for more details and further customizations - <https://getstream.github.io/stream-chat-react/#section-streami18n>

## Contributing

We welcome code changes that improve this library or fix a problem. Please make sure to follow all best practices and add tests if applicable before submitting a Pull Request on Github. We are pleased to merge your code into the official repository. Make sure to sign our [Contributor License Agreement (CLA)](https://docs.google.com/forms/d/e/1FAIpQLScFKsKkAJI7mhCr7K9rEIOpqIDThrWxuvxnwUq2XkHyG154vQ/viewform) first. See our license file for more details.
