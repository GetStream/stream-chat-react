# Official React SDK for [Stream Chat](https://getstream.io/chat/sdk/react/)

<p align="center">
  <a href="https://getstream.io/chat/react-chat/tutorial/"><img src="https://i.imgur.com/SRkDlFX.png" alt="react native chat" width="60%" /></a>
</p>

> The official React components for Stream Chat, a service for
> building chat applications.

[![NPM](https://img.shields.io/npm/v/stream-chat-react.svg)](https://www.npmjs.com/package/stream-chat-react)
[![build](https://github.com/GetStream/stream-chat-react/actions/workflows/ci.yml/badge.svg)](https://github.com/GetStream/stream-chat-react/actions)
[![Component Reference](https://img.shields.io/badge/docs-component%20reference-blue.svg)](https://getstream.io/chat/docs/sdk/react/)
[![codecov](https://codecov.io/gh/GetStream/stream-chat-react/branch/master/graph/badge.svg)](https://codecov.io/gh/GetStream/stream-chat-react)

<img align="right" src="https://getstream.imgix.net/images/chat/chattutorialart@3x.png?auto=format,enhance" width="50%" />

**Quick Links**

- [Register](https://getstream.io/chat/trial/) to get an API key for Stream Chat
- [React Chat Tutorial](https://getstream.io/chat/react-chat/tutorial/)
- [Demo Apps](https://getstream.io/chat/demos/)
- [Component Docs](https://getstream.io/chat/docs/sdk/react/)
- [Chat UI Kit](https://getstream.io/chat/ui-kit/)
- [Internationalization](#internationalization)

With our component library, you can build a variety of chat use cases, including:

- Livestream like Twitch or YouTube
- In-game chat like Overwatch or Fortnite
- Team-style chat like Slack
- Messaging-style chat like WhatsApp or Facebook's Messenger
- Customer support chat like Drift or Intercom

## React Chat Tutorial

The best way to get started is to follow the [React Chat Tutorial](https://getstream.io/chat/react-chat/tutorial/). It shows you how to use this SDK to build a fully functional chat application and includes common customizations.

## Free for Makers

Stream is free for most side and hobby projects. To qualify, your project/company must have no more than 5 team members and earn less than $10k in monthly revenue.
For complete pricing and details visit our [Chat Pricing Page](https://getstream.io/chat/pricing/).

## Installation

### With NPM

`npm install stream-chat stream-chat-react`

### With Yarn

`yarn add stream-chat stream-chat-react`

## Example Applications

We have built five demo applications showcasing a variety of chat use cases, including social messaging, team collaboration, customer support, livestream gaming, and virtual event. You can preview these [demos](https://getstream.io/chat/demos/) on our website. Also, the code is [open source](https://github.com/GetStream/website-react-examples/).

## Documentation

We use a doc generator to build our [component documentation](https://getstream.io/chat/docs/sdk/react/). We provide a brief description of each chat component and define all of the props it accepts.

The React components are created using the [stream-chat](https://github.com/getstream/stream-chat-js) library. If you're customizing the components, it's likely you'll need to make additional calls to our Chat API using our JavaScript client, which has [documentation](https://getstream.io/chat/docs/javascript/) on our website.

## Component Reusability

For components that implement significant logic, it's helpful to split the component into two parts: a top-level component which handles functionality and a lower level component which renders the UI. This way you can swap UI without altering the logic that gives the component its functionality. We use this provider/consumer pattern frequently in the library, and the below example shows how to swap out the `Message` UI component with `CustomMessageUI` (using `WithComponents`), without affecting any logic in the application.

```jsx
<Channel>
  <Window>
    <ChannelHeader />
    <WithComponents overrides={{ Message: CustomMessageUI }}>
      <MessageList />
    </WithComponents>
    <MessageInput />
  </Window>
  <Thread />
</Channel>
```

### Customizing Styles

The preferred method for overriding the pre-defined styles in the library is to two-step process. First, import our bundled CSS into your main CSS file (or CSS file loaded with your chat application). Second, locate any Stream styles you want to override using either the browser inspector or by viewing the library code. You can then add selectors to your local CSS file to override our defaults (ideally within the stream-overrides layer). Layers (when ordered correctly, see example) ensure that your overrides take precedence even if your overriding selectors are less specific. For example:

```css title="index.css"
@layer stream, stream-overrides;

@import 'stream-chat-react/css/v2/index.css' layer(stream);
/* or */
@import 'stream-chat-react/dist/css/v2/index.css' layer(stream);

@layer stream-overrides {
  /* your overrides */
}
```

## Internationalization

Our library supports auto-translation for various user languages. Please read our internationalization [documentation](https://getstream.io/chat/docs/sdk/react/customization/translations/) for further details and setup guidance.

## Contributing

We welcome code changes that improve this library or fix a problem. Please make sure to follow all best practices and add tests, if applicable, before submitting a pull request on GitHub. We are pleased to merge your code into the official repository if it meets a need. Make sure to sign our [Contributor License Agreement (CLA)](https://docs.google.com/forms/d/e/1FAIpQLScFKsKkAJI7mhCr7K9rEIOpqIDThrWxuvxnwUq2XkHyG154vQ/viewform) first. See our license file for more details.

## We are hiring!

We recently closed a [$38 million Series B funding round](https://techcrunch.com/2021/03/04/stream-raises-38m-as-its-chat-and-activity-feed-apis-power-communications-for-1b-users/) and are actively growing.
Our APIs are used by more than a billion end-users, and by working at Stream, you have the chance to make a huge impact on a team of very strong engineers.

Check out our current openings and apply via [Stream's website](https://getstream.io/team/#jobs).

## Acknowledgements

### lamejs

This project uses `lamejs` library under the LGPL license to convert the recorded audio to mp3 format.
The library source code is dynamically imported and used only if audio recording is enabled.

You can obtain the source code for `lamejs` from the [lamejs repository](https://github.com/gideonstele/lamejs) that is a fork of [the original JS library](https://github.com/zhuker/lamejs).
You can find the source code for LAME at https://lame.sourceforge.net and its license at: https://lame.sourceforge.net/license.txt
