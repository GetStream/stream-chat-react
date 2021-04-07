# Changelog


## [5.1.3](https://github.com/GetStream/stream-chat-react/releases/tag/v5.1.3) 2021-04-06

### Feature

- Optimize message list components by limiting excess `loadMore` calls [#841](https://github.com/GetStream/stream-chat-react/pull/841)

### Bug

- Fix `AutoCompleteTextarea` trigger highlighting bug [#839](https://github.com/GetStream/stream-chat-react/pull/839)

## [5.1.2](https://github.com/GetStream/stream-chat-react/releases/tag/v5.1.2) 2021-04-05

### Feature

- Provide option to hide `DateSeparator` component for new messages with the `hideNewMessageSeparator` prop on `MessageList` and `VirtualizedMessageList` components [#837](https://github.com/GetStream/stream-chat-react/pull/837)

### Bug

- Fix bad conditional in `useMentionsHandlers` custom hook [#836](https://github.com/GetStream/stream-chat-react/pull/836)

## [5.1.1](https://github.com/GetStream/stream-chat-react/releases/tag/v5.1.1) 2021-04-02

### Feature

- Show formatted date separator for new messages [#818](https://github.com/GetStream/stream-chat-react/pull/818)
- Provide option to display flag emojis as images on Windows via `useImageFlagEmojisOnWindows` prop [#821](https://github.com/GetStream/stream-chat-react/pull/821)
- Hide reaction icon when a message has reactions [#826](https://github.com/GetStream/stream-chat-react/pull/826)

### Chore

- Update types on `Chat` component [#825](https://github.com/GetStream/stream-chat-react/pull/825)
- Update Prettier settings [#831](https://github.com/GetStream/stream-chat-react/pull/831)

### Bug

- Escape characters that break emoji regex [#823](https://github.com/GetStream/stream-chat-react/pull/823)
- Fix autocomplete textarea text replace algorithm [#827](https://github.com/GetStream/stream-chat-react/pull/827)
- Force close suggestions list on submit [#828](https://github.com/GetStream/stream-chat-react/pull/828)

## [5.1.0](https://github.com/GetStream/stream-chat-react/releases/tag/v5.1.0) 2021-03-30

### Feature

- Add type support for Moment.js date objects [#809](https://github.com/GetStream/stream-chat-react/pull/809)
- Add i18n translation support for `ChannelPreview` [#810](https://github.com/GetStream/stream-chat-react/pull/810)
- Allow `addNotification` function to be called anywhere within `Channel` [#811](https://github.com/GetStream/stream-chat-react/pull/811)
- Hide `MessageActions` if no actions exist [#816](https://github.com/GetStream/stream-chat-react/pull/816)

### Chore

- Refactor failed message UI component [#811](https://github.com/GetStream/stream-chat-react/pull/811)
- Remove extra `watchers` query [#817](https://github.com/GetStream/stream-chat-react/pull/817)
- Prevent `queryUsers` from searching a null value [#817](https://github.com/GetStream/stream-chat-react/pull/817)

## [5.0.3](https://github.com/GetStream/stream-chat-react/releases/tag/v5.0.3) 2021-03-24

### Feature

- Add customization options for `renderText` function [#807](https://github.com/GetStream/stream-chat-react/pull/807)

## [5.0.2](https://github.com/GetStream/stream-chat-react/releases/tag/v5.0.2) 2021-03-23

### Bug

- Fix optimistic UI for mentions [#800](https://github.com/GetStream/stream-chat-react/pull/800)

## [5.0.1](https://github.com/GetStream/stream-chat-react/releases/tag/v5.0.1) 2021-03-23

### Chore

- Upgrade `react-file-utils` to v1.0.2

## [5.0.0](https://github.com/GetStream/stream-chat-react/releases/tag/v5.0.0) 2021-03-22

### 🎉 TYPESCRIPT 🎉

- The entire component library has been converted to TypeScript
- Despite the major tag, this release is non-breaking
- Read our [TypeScript Support](https://github.com/GetStream/stream-chat-react/wiki/Typescript-Support) wiki for guidance on instantiating a `StreamChat` client with your custom types via generics

### Feature

- Conversion to TypeScript [#797](https://github.com/GetStream/stream-chat-react/pull/797)

## [4.1.3](https://github.com/GetStream/stream-chat-react/releases/tag/v4.1.3) 2021-03-12

### Chore

- Remove legacy example apps [#766](https://github.com/GetStream/stream-chat-react/pull/766)
- Handle soft deleted messages in `VirtualizedMessageList` [#773](https://github.com/GetStream/stream-chat-react/pull/773)

### Bug

- Add missing ChannelPreview helpers to exports [#775](https://github.com/GetStream/stream-chat-react/pull/775)

## [4.1.2](https://github.com/GetStream/stream-chat-react/releases/tag/v4.1.2) 2021-03-09

### Feature

- Export `ChannelPreview` utility functions [#750](https://github.com/GetStream/stream-chat-react/pull/750)
- Memoize `ChannelList` `filters` to prevent extra channel queries [#752](https://github.com/GetStream/stream-chat-react/pull/752)

### Chore

- Update Customizing Styles section of README [#756](https://github.com/GetStream/stream-chat-react/pull/756)
- Change `emoji-mart` imports to support server-side rendering [#764](https://github.com/GetStream/stream-chat-react/pull/764)

### Bug

- Close emoji picker on emoji icon click [#751](https://github.com/GetStream/stream-chat-react/pull/751)
- Hide reaction tooltip on click [#753](https://github.com/GetStream/stream-chat-react/pull/753)

## [4.1.1](https://github.com/GetStream/stream-chat-react/releases/tag/v4.1.1) 2021-02-26

### Chore

- Upgrade `stream-chat` dependency to fix reaction caching issue [#742](https://github.com/GetStream/stream-chat-react/pull/742)

### Bug

- Fix markdown link rendering issues [#742](https://github.com/GetStream/stream-chat-react/pull/742)

## [4.1.0](https://github.com/GetStream/stream-chat-react/releases/tag/v4.1.0) 2021-02-25

### Chore

- Upgrade `react-virtuoso` dependency [#694](https://github.com/GetStream/stream-chat-react/pull/694)
  - Improved support for loading unevenly sized messages when scrolling back
  - Support smooth scrolling to bottom when new messages are posted (controlled through `stickToBottomScrollBehavior` property)
  - Adding reactions no longer cancels the automatic scrolling when new messages appear
- Generate minified CSS output [#707](https://github.com/GetStream/stream-chat-react/pull/707)
- Upgrade `stream-chat` dependency [#727](https://github.com/GetStream/stream-chat-react/pull/727)
- Upgrade `mml-react` dependency [#728](https://github.com/GetStream/stream-chat-react/pull/728)
- Upgrade `emoji-mart` dependency [#731](https://github.com/GetStream/stream-chat-react/pull/731)

### Feature

- Add `tabIndex` to emoji picker [#710](https://github.com/GetStream/stream-chat-react/pull/710)
- Add `dispatch` function from `channelReducer` to `ChannelContext` [#717](https://github.com/GetStream/stream-chat-react/pull/717)
- Improve mobile support for display of the `MessageOptions` component [#723](https://github.com/GetStream/stream-chat-react/pull/723)
- Add key down a11y support for emoji picker [#726](https://github.com/GetStream/stream-chat-react/pull/726)
- Add `scrolledUpThreshold` prop to `MessageList` [#734](https://github.com/GetStream/stream-chat-react/pull/734)

### Bug

- Fix reaction list click propagation issue [#722](https://github.com/GetStream/stream-chat-react/pull/722)
- Fix reaction list non-breaking space issue [#725](https://github.com/GetStream/stream-chat-react/pull/725)
- Fix URL markdown in code blocks [#733](https://github.com/GetStream/stream-chat-react/pull/733)

## [4.0.1](https://github.com/GetStream/stream-chat-react/releases/tag/v4.0.1) 2021-02-11

### Chore

- Add `usePinHandler` example to docs [#705](https://github.com/GetStream/stream-chat-react/pull/705)
- Remove legacy APIs in mock data used for generating the docs [#704](https://github.com/GetStream/stream-chat-react/pull/704)

## [4.0.0](https://github.com/GetStream/stream-chat-react/releases/tag/v4.0.0) 2021-02-10

### ⚠️ BREAKING CHANGES ⚠️

- Removed the `seamless-immutable` dependency and its corresponding methods and types [#687](https://github.com/GetStream/stream-chat-react/pull/687)

  - We also removed this dependency at the `stream-chat` JS client level, therefore immutable methods, such as `setIn`, no longer need to be run
    on the returned data [#602](https://github.com/GetStream/stream-chat-js/pull/602)
  - Responses from the Stream API will now return standard JS data structures, without the immutable wrapping
  - **When you upgrade to v4.0.0 of `stream-chat-react`, make sure you also upgrade to v3.0.0 of `stream-chat`**

### Feature

- Performance optimize and allow customization of the `emoji-mart` dependency [#530](https://github.com/GetStream/stream-chat-react/pull/530)
- Add custom `image` prop to `ChannelHeader` component [#697](https://github.com/GetStream/stream-chat-react/pull/697)

### Chore

- Removed the SonarJS linting rules [#693](https://github.com/GetStream/stream-chat-react/pull/693)

### Bug

- Fix permissions bug with custom channel types [#695](https://github.com/GetStream/stream-chat-react/pull/695)
- Fix `ChannelHeader` CSS alignment issue [#699](https://github.com/GetStream/stream-chat-react/pull/699)

## [3.6.0](https://github.com/GetStream/stream-chat-react/releases/tag/v3.6.0) 2021-02-02

### Feature

- Added support for pinned messages [#682](https://github.com/GetStream/stream-chat-react/pull/682)

  - Save `pinnedMessages` to ChannelContext
  - Create `usePinHandler` custom hook for returning `canPin` value and `handlePin` function
  - Add Pin/Unpin as optional actions in `MessageActions`
  - Add `PinIndicator` UI component to `MessageLivestream` and `MessageTeam`
  - Add optional `"pinned-message"` CSS class to message UI components
  - Add `getPinMessageErrorNotification` and `pinPermissions` as `MessageList` props

- Hide `DateSeparator` component when all messages for a day are deleted [#689](https://github.com/GetStream/stream-chat-react/pull/689)

### Chore

- Refactor example apps to use `getInstance` and `connectUser` [#688](https://github.com/GetStream/stream-chat-react/pull/688)

### Bug

- Display auto-translated message text when it exists [#683](https://github.com/GetStream/stream-chat-react/pull/683)
- Add missing export for `VirtualizedMessageList` type [#691](https://github.com/GetStream/stream-chat-react/pull/691)

## [3.5.3](https://github.com/GetStream/stream-chat-react/releases/tag/v3.5.3) 2021-01-26

### Feature

- `ChannelList` accepts an optional prop to filter/sort channels prior to render [#678](https://github.com/GetStream/stream-chat-react/pull/678)

## [3.5.2](https://github.com/GetStream/stream-chat-react/releases/tag/v3.5.2) 2021-01-21

### Fix

- Handle emoji picker event listener race condition [#675](https://github.com/GetStream/stream-chat-react/pull/675)
- Adjust style for only emoji messages [#676](https://github.com/GetStream/stream-chat-react/pull/676)

## [3.5.1](https://github.com/GetStream/stream-chat-react/releases/tag/v3.5.1) 2021-01-19

### Fix

- Upload PSD attachments as file [#673](https://github.com/GetStream/stream-chat-react/pull/673)

### Chore

- Bump MML-React [#674](https://github.com/GetStream/stream-chat-react/pull/674)

## [3.5.0](https://github.com/GetStream/stream-chat-react/releases/tag/v3.5.0) 2021-01-15

## Feature

- Support typing indicator in Thread component [#662](https://github.com/GetStream/stream-chat-react/pull/662)
- Add parent ID to typing events [#665](https://github.com/GetStream/stream-chat-react/pull/665)
- Allow MessageInput emoji and file upload icon customization [#666](https://github.com/GetStream/stream-chat-react/pull/666)
- Add optional `disableMentions` prop to MessageInput and update mentions UI [#669](https://github.com/GetStream/stream-chat-react/pull/669)

## Fix

- Fix maxLength paste text bug [#670](https://github.com/GetStream/stream-chat-react/pull/670)

## [3.4.6](https://github.com/GetStream/stream-chat-react/releases/tag/v3.4.6) 2021-01-08

## Feature

- Add SuggestionList as MessageInput prop to override default List and Item component to display trigger suggestions [#655](https://github.com/GetStream/stream-chat-react/pull/655)
- Add allowNewMessagesFromUnfilteredChannels prop to ChannelList [#663](https://github.com/GetStream/stream-chat-react/pull/663)

## Fix

- Fix type for mentions handler [#660](https://github.com/GetStream/stream-chat-react/pull/660)

## Chore

- Convert Thread to functional component [#650](https://github.com/GetStream/stream-chat-react/pull/650)
- Convert messaging sample app to functional component [#661](https://github.com/GetStream/stream-chat-react/pull/661)

## [3.4.5](https://github.com/GetStream/stream-chat-react/releases/tag/v3.4.5) 2021-01-07

## Feature

- Message components accept custom EditMessageInput component [#656](https://github.com/GetStream/stream-chat-react/pull/656)

## Fix

- Message actions default options doc [#654](https://github.com/GetStream/stream-chat-react/pull/654)
- MessageList unread TypeError [#654](https://github.com/GetStream/stream-chat-react/pull/654)
- ChannelHeader button css padding [#648](https://github.com/GetStream/stream-chat-react/pull/648)

## Chore

- Bump dependencies [#657](https://github.com/GetStream/stream-chat-react/pull/657) [#659](https://github.com/GetStream/stream-chat-react/pull/659)

## [3.4.4](https://github.com/GetStream/stream-chat-react/releases/tag/v3.4.4) 2020-12-23

## Addition

- Export the UploadsPreview component. [#647](https://github.com/GetStream/stream-chat-react/pull/647)

## [3.4.3](https://github.com/GetStream/stream-chat-react/releases/tag/v3.4.3) 2020-12-16

## Fix

- Browser bundle undefined variable

## [3.4.2](https://github.com/GetStream/stream-chat-react/releases/tag/v3.4.2) 2020-12-16

## Adjustment

- Changes default smiley face icon for reaction selector. [#645](https://github.com/GetStream/stream-chat-react/pull/645)

## [3.4.1](https://github.com/GetStream/stream-chat-react/releases/tag/v3.4.1) 2020-12-15

## Feature

- Adds custom UI component prop `ThreadHeader` to `Thread` to override the default header. [#642](https://github.com/GetStream/stream-chat-react/pull/642)

## [3.4.0](https://github.com/GetStream/stream-chat-react/releases/tag/v3.4.0) 2020-12-14

## Feature

- MML is supported by default in all Message components except `MessageLiveStream`. [#562](https://github.com/GetStream/stream-chat-react/pull/562)

  For more detail about how to use MML please refer to [mml-react](https://getstream.github.io/mml-react/) docs.

## [3.3.2](https://github.com/GetStream/stream-chat-react/releases/tag/v3.3.2) 2020-12-11

## Fix

- Add error handling for `loadMoreThread` API request [#627](https://github.com/GetStream/stream-chat-react/pull/627)

## [3.3.1](https://github.com/GetStream/stream-chat-react/releases/tag/v3.3.1) 2020-12-9

## Fix

- Add additional user role check for `isModerator` boolean [#625](https://github.com/GetStream/stream-chat-react/pull/625)

## [3.3.0](https://github.com/GetStream/stream-chat-react/releases/tag/v3.3.0) 2020-12-3

## Feature

- Allow all instances of Avatar to be overridden with a custom component via props [#610](https://github.com/GetStream/stream-chat-react/pull/610)

## [3.2.4](https://github.com/GetStream/stream-chat-react/releases/tag/v3.2.4) 2020-11-19

## Fix

- Prevent firing LoadMore requests when browser is offline [#614](https://github.com/GetStream/stream-chat-react/pull/614)
- Support muted channels in ChannelPreview [#608](https://github.com/GetStream/stream-chat-react/pull/608)
- `ChannelContext.sendMessage` type accepts missing text [#613](https://github.com/GetStream/stream-chat-react/pull/613)

## [3.2.3](https://github.com/GetStream/stream-chat-react/releases/tag/v3.2.3) 2020-11-13

## Fix

- Email links are clickable [#607](https://github.com/GetStream/stream-chat-react/pull/607)
- `message.own_reactions` passed into Reaction components [#604](https://github.com/GetStream/stream-chat-react/pull/604)

## [3.2.2](https://github.com/GetStream/stream-chat-react/releases/tag/v3.2.2) 2020-11-05

## Fix

- `VirtualizedMessageList` breaking the list for falsy messages [#602](https://github.com/GetStream/stream-chat-react/pull/602)
- `FixedHeightMessage` action box not opening in React@17 [#602](https://github.com/GetStream/stream-chat-react/pull/602)
- Missing custom hooks type [#601](https://github.com/GetStream/stream-chat-react/pull/601)

## [3.2.1](https://github.com/GetStream/stream-chat-react/releases/tag/v3.2.1) 2020-11-04

## Fix

- `VirtualizedMessageList` stick to bottom [#597](https://github.com/GetStream/stream-chat-react/pull/597)

## [3.2.0](https://github.com/GetStream/stream-chat-react/releases/tag/v3.2.0) 2020-11-04

## Chore

- Support React v17 [#588](https://github.com/GetStream/stream-chat-react/pull/588)

## [3.1.7](https://github.com/GetStream/stream-chat-react/releases/tag/v3.1.7) 2020-10-29

## Fix

- Improved errorHandling on failed uploads. [#596](https://github.com/GetStream/stream-chat-react/pull/596)
- Escape special characters in mentioned_users names [#591](https://github.com/GetStream/stream-chat-react/pull/591)
- Improve handling max files(10) in MessageInput [#593](https://github.com/GetStream/stream-chat-react/pull/593)

## [3.1.6](https://github.com/GetStream/stream-chat-react/releases/tag/v3.1.6) 2020-10-21

## Fix

- `displayActions` prop is respected in `MessageOptions` component [#587](https://github.com/GetStream/stream-chat-react/pull/587)

## Chore

- `stream-chat-js` required version bumped to `2.7.x` [#582](https://github.com/GetStream/stream-chat-react/pull/582)

## [3.1.5](https://github.com/GetStream/stream-chat-react/releases/tag/v3.1.5) 2020-10-19

## Feature

- Disable upload dropzone and input button in Input components based on channel config [#585](https://github.com/GetStream/stream-chat-react/pull/585)

## Fix

- Disable the upload dropzone and input button when the maximum number of allowed attachments is reached [#577](https://github.com/GetStream/stream-chat-react/pull/577)

## [3.1.4](https://github.com/GetStream/stream-chat-react/releases/tag/v3.1.4) 2020-10-19

## Fix

- Fixed a bug with ChannelList pagination with low limits or high thresholds [#583](https://github.com/GetStream/stream-chat-react/pull/583)

## Added

- Disable reactions based on channel config [#581](https://github.com/GetStream/stream-chat-react/pull/581)
- Disable Thread based on channel config [#580](https://github.com/GetStream/stream-chat-react/pull/580)
- Disable TypingIndicator based on channel config [#579](https://github.com/GetStream/stream-chat-react/pull/579)

## [3.1.3](https://github.com/GetStream/stream-chat-react/releases/tag/v3.1.3) 2020-10-15

## Fix

- Better handling of offsets during loadMore [#578](https://github.com/GetStream/stream-chat-react/pull/578)

## [3.1.2](https://github.com/GetStream/stream-chat-react/releases/tag/v3.1.2) 2020-10-14

# Fix

Event handler for `message.new` by default moves the channel to top of the list. But it didn't handle the case where channel was not already present in list. `useMessageNewHandler` has been updated to handle this case. [c563252](https://github.com/GetStream/stream-chat-react/commit/c5632521566fe8ad8c3a05a6648b4cdc3c4daafe)

## [3.1.1](https://github.com/GetStream/stream-chat-react/releases/tag/v3.1.1) 2020-10-14

## Fix

- FixedHeightMessage text overflow [#573](https://github.com/GetStream/stream-chat-react/pull/573)
- Prevent state updates on unmounted Channel component [#566](https://github.com/GetStream/stream-chat-react/pull/566)

## [3.1.0](https://github.com/GetStream/stream-chat-react/releases/tag/v3.1.0) 2020-10-14

## Feature

- VirtualizedMessageList supports message grouping [#571](https://github.com/GetStream/stream-chat-react/pull/571)

```js
<VirtualizedMessageList shouldGroupByUser />
```

## Fix

- VirtualizedMessageList TypingIndicator is disabled by default [#571](https://github.com/GetStream/stream-chat-react/pull/571)

## [3.0.3](https://github.com/GetStream/stream-chat-react/releases/tag/v3.0.3) 2020-10-13

## Fix

- Security [issue](https://github.com/GetStream/stream-chat-react/issues/569) due to missing `rel="noopener noreferrer"` in rendered links [#570](https://github.com/GetStream/stream-chat-react/pull/570)

## [3.0.2](https://github.com/GetStream/stream-chat-react/releases/tag/v3.0.2) 2020-10-12

- Bump stream-chat to v2.6.0 [#568](https://github.com/GetStream/stream-chat-react/pull/568)

## [3.0.1](https://github.com/GetStream/stream-chat-react/releases/tag/v3.0.1) 2020-10-05

- Bumped dependencies [#558](https://github.com/GetStream/stream-chat-react/pull/558)

## Fix

- Fixed issues on docs [#556](https://github.com/GetStream/stream-chat-react/pull/556)
- Fix type issues [#557](https://github.com/GetStream/stream-chat-react/pull/557)
- Keep channel.members in sync [#561](https://github.com/GetStream/stream-chat-react/pull/561)

## Added

- Export EmojiPicker [#560](https://github.com/GetStream/stream-chat-react/pull/560)

## [3.0.0](https://github.com/GetStream/stream-chat-react/releases/tag/v3.0.0) 2020-09-30

### BREAKING CHANGES

- Image component renamed to ImageComponent [#554](https://github.com/GetStream/stream-chat-react/pull/554)

## [2.6.2](https://github.com/GetStream/stream-chat-react/releases/tag/v2.6.2) 2020-09-29

### Fix

- Fixed several type issues [#552](https://github.com/GetStream/stream-chat-react/pull/552)

## [2.6.1](https://github.com/GetStream/stream-chat-react/releases/tag/v2.6.1) 2020-09-29

### Fix

- Fixed an issue with MessageLivestream where mutes and flags were not happening [#551](https://github.com/GetStream/stream-chat-react/pull/551)

## [2.6.0](https://github.com/GetStream/stream-chat-react/releases/tag/v2.6.0) 2020-09-29

### Feature

- New messages date indicator in MessageList and VritualizedMessageList [#548](https://github.com/GetStream/stream-chat-react/pull/548)
- Reply/Reactions are available in messageActions [#547](https://github.com/GetStream/stream-chat-react/pull/547)

### Fix

- Fix opacity on emoji in EditMessageForm [#540](https://github.com/GetStream/stream-chat-react/pull/540)
- Sanitize URL image sources in Image component [#543](https://github.com/GetStream/stream-chat-react/pull/543)
- Add first letter of display name to avatar [#545](https://github.com/GetStream/stream-chat-react/pull/545)

## [2.5.0](https://github.com/GetStream/stream-chat-react/releases/tag/v2.5.0) 2020-09-24

### Feature

- TypingIndicator component is added by default to both MessageList and VirtualizedMessageList components. This component can also be used by its own. [#535](https://github.com/GetStream/stream-chat-react/pull/535)

## [2.4.0](https://github.com/GetStream/stream-chat-react/releases/tag/v2.4.0) 2020-09-17

### Feature

- [VirtualizedMessageList](https://github.com/GetStream/stream-chat-react/blob/master/src/docs/VirtualizedMessageList.md) is a new component that can handle thousands of messages in a channel. It uses a virtualized list under the hood. #487

### Fix

- Typescript generics of stream chat js are ABC adjusted #521

## [2.3.3](https://github.com/GetStream/stream-chat-react/releases/tag/v2.3.3) 2020-09-15

- Refactored Attachment component to now also accept a Gallery prop that will handle when the attachments array contains multiple images.
- Upgraded react-file-utils which fixes image previews not displaying on the EditMessageForm
- Fix PropType errors
- Fix an issue with the infinite scroll on the MessageList when the client is offline

## [2.3.2](https://github.com/GetStream/stream-chat-react/releases/tag/v2.3.2) 2020-09-10

- Upgrading stream-chat to 2.2.2

## [2.3.1](https://github.com/GetStream/stream-chat-react/releases/tag/v2.3.1) 2020-09-10

- Upgrading stream-chat to 2.2.1

## [2.3.0](https://github.com/GetStream/stream-chat-react/releases/tag/v2.3.0) 2020-09-10

- Upgraded `stream-chat` package to `v2.2.0`

  - `stream-chat` package has been migrated to complete typescript in 2.x.x. There were no breaking change with underlying
    javascript api and also typescript except for [Event type](https://github.com/GetStream/stream-chat-js/blob/master/CHANGELOG.md#august-26-2020---200). We recommend you to check the changelog for stream-chat-js repository as well for more details
    if you are planning to upgrade from `stream-chat-react@2.2.x` to `stream-chat-react@2.3.x`
  - This PR which contains typescript related changes in stream-chat-react for given upgrade - https://github.com/GetStream/stream-chat-react/pull/499/files

## [2.2.2](https://github.com/GetStream/stream-chat-react/releases/tag/v2.2.2) 2020-08-21

- Separated ConnectionStatus component from MessageList [82c8927](https://github.com/GetStream/stream-chat-react/commit/82c892773cd4aebed275259c93829ba6cb34b0be)
- Bug fix: When Channel component is standalone used (without ChannelList), mentions feature wouldn't work [4f64abc](https://github.com/GetStream/stream-chat-react/commit/4f64abcda95c77344a973b2972965a70b0cd8295)

## [2.2.1](https://github.com/GetStream/stream-chat-react/releases/tag/v2.2.1) 2020-07-31

- Added listener for channel.hidden event and prop to override the default behaviour onChannelHidden [643af50](https://github.com/GetStream/stream-chat-react/commit/33739bd730f61da62e6fbe305a2807575643af50)
- Added listener for channel.visible event and prop to override the default behaviour onChannelVisible [56e1208](https://github.com/GetStream/stream-chat-react/commit/5066052d0948310582c74476d3981965b56e1208)

## [2.2.0](https://github.com/GetStream/stream-chat-react/releases/tag/v2.2.0) 2020-07-31

- Added doMarkReadRequest prop to Channel component, to override markRead api calls [49a058b8](https://github.com/GetStream/stream-chat-react/commit/49a058b8489699fb3de4fc5f7041a4d09d9acd39)

## [2.1.3](https://github.com/GetStream/stream-chat-react/releases/tag/v2.1.3) 2020-07-27

- Fix empty reaction showing bubble [#473](https://github.com/GetStream/stream-chat-react/pull/473)

## [2.1.2](https://github.com/GetStream/stream-chat-react/releases/tag/v2.1.2) 2020-07-27

- Add formatDate to docs [#469](https://github.com/GetStream/stream-chat-react/pull/469)
- Allow reaction override in Message components [#470](https://github.com/GetStream/stream-chat-react/pull/470)
- Fix runtime require in browser bundle [#472](https://github.com/GetStream/stream-chat-react/pull/472)

## [2.1.1](https://github.com/GetStream/stream-chat-react/releases/tag/v2.1.1) 2020-07-22

- Bumped `react-file-utils` to `0.3.15` which includes an upgraded version of `blueimp-load-image` which makes it easier to use this library in SSR apps.

## [2.1.0](https://github.com/GetStream/stream-chat-react/releases/tag/v2.1.0) 2020-07-22

- Rename exported component `File` to `FileAttachment` to avoid overriding `window.File` in bundled release

## [2.0.4](https://github.com/GetStream/stream-chat-react/releases/tag/v2.0.4) 2020-07-21

- Fixed type issues
- Fixed an issue with the mobile navigation
- Added the ability to customize the datetime stamp on Message components using the `formatDate` prop

## [2.0.3](https://github.com/GetStream/stream-chat-react/releases/tag/v2.0.3) 2020-07-20

- All components using mutes get them using the useContext hook.
- Performance updates
- Fix for document.title when read_events are disabled
- Added docs on using included hooks

## [2.0.2](https://github.com/GetStream/stream-chat-react/releases/tag/v2.0.2) 2020-07-16

- Fixed some issues with editing messages
- Fixed some issues with muting/unmuting messages

## [2.0.1](https://github.com/GetStream/stream-chat-react/releases/tag/v2.0.1) 2020-07-15

We’re bumping `stream-chat-react` to version 2.0.1 because over the past three months we’ve been doing a major refactor of our codebase. The foundational work includes:

- Major refactor and code cleanup
- Components have been rewritten to use React Hooks
- Added tests for all components
- Performance improvements on MessageList
- Upgraded dependencies

### Breaking changes

- Drop node 11, 13
- Deprecating context HOC’s
  Since we moved our library to rely on React Hooks moved the following HOC’s to use `useContext` :
  - `withChannelContext`
  - `withChatContext`
  - `withTranslationContext`
    This means we now directly use the context values from the context and they’re not passed down from the props anymore.
- The `updateMessage` on the channel context does not support extraState anymore.
- There no longer is a ref inside a ref in ReactionsList. Instead, the ref of the container div is directly forwarded by the component.

### Addidtions

- Triggers on MessageInput can now be overwritten using the autocompleteTriggers prop on `MessageInput`

### Fixes

- Fixed styling on autocomplete suggestions
- Fixed YouTube video rendering in messages
- Fixed an issue that allowed you to send empty messages
- Bugfix in groupStyles calculations

## [1.2.5](https://github.com/GetStream/stream-chat-react/releases/tag/v1.2.5) 2020-06-30

- Added `LoadingIndicator` prop to MessageList
- Fixed some minor styling issues with SafeAnchor

## [1.2.4](https://github.com/GetStream/stream-chat-react/releases/tag/v1.2.4) 2020-06-30

- Refactor and improvements to the Gallery Modal component

## [1.2.3](https://github.com/GetStream/stream-chat-react/releases/tag/v1.2.3) 2020-06-30

- Fixing types

## [1.2.2](https://github.com/GetStream/stream-chat-react/releases/tag/v1.2.2) 2020-06-22

- Fixing types

## [1.2.1](https://github.com/GetStream/stream-chat-react/releases/tag/v1.2.1) 2020-06-17

- Fixed an issue with our type definitions introduced in `1.2.0`

## [1.2.0](https://github.com/GetStream/stream-chat-react/releases/tag/v1.2.0) 2020-06-16

- @mentions now use the queryMembers endpoint enabling mentions in channels of more that 100 members
- Fix for .mov videos
- Refactors and a lot of new tests
- Some small bug fixes

## [1.1.2](https://github.com/GetStream/stream-chat-react/releases/tag/v1.1.2) 2020-06-11

- Fixes issue with File uploads on MessageInputLarge
- Make sure to only render videos if the browser supports it

## [1.1.1](https://github.com/GetStream/stream-chat-react/releases/tag/v1.1.1) 2020-06-09

- Fixes links when written as markdown
- Allows app:// protocol in markdown links

## [1.1.0](https://github.com/GetStream/stream-chat-react/releases/tag/v1.1.0) 2020-06-08

**Breaking Change**

- Migrated ChannelList component to functional component.

  `ChannelList` component comes with some default handlers for following events.

  1. notification.message_new
  2. notification.added_to_channel
  3. notification.removed_from_channel
  4. channel.updated
  5. channel.deleted
  6. channel.truncated

  But these default event handlers can be overriden by providing corresponding
  prop functions for handling the event. For example, to override `notification.message_new` event,
  you can provide prop function - `onMessageNew`, to ChannelList component.

  Until now, ChannelList component was class based, so function prop (e.g., `onMessageNew`) used to accept
  following 2 parameters:

  1. thisArg - `this` reference of component. You could use this to update the state of the
     component as well. e.g., `thisArg.setState({ ... })`
  2. event - Event object

  In this release, we have migrated ChannelList component to functional component and thus
  `thisArg` is no longer accessible. Instead we provide the setter (from `useState` hook) for channels.
  So updated params to these custom event handlers (prop functions) is as follow:

  1. setChannels {function} Setter for channels.
  2. event {object} Event object

  And same applies to all the rest of the custom event handlers:

  - onMessageNew
  - onAddedToChannel
  - onRemovedFromChannel
  - onChannelUpdated
  - onChannelTruncated
  - onChannelDeleted

**Fixes:**

- Correctly set attachment type based on mime type
- Fixes to audio component
- Mentions: filter out no-longer-mentioned users on submit

**Other:**

- Type fixes
- Tests
- Refactors

## [1.0.0](https://github.com/GetStream/stream-chat-react/releases/tag/v1.0.0) 2020-05-15

We've already been on a v1 release for a while but never updated our versioning. Right now we're in the process of rewriting our components to be more future proof and we started using hooks, hence the v1.0.0 today.

**Breaking change:** `stream-chat-react` now relies on hooks and will need at least `v16.8.x` of `react` to work.

- Fixed some issues with mutes
- Fixed issues with attachments
- Added tests

## [0.12.1](https://github.com/GetStream/stream-chat-react/releases/tag/v0.12.1) 2020-05-12

- Render video uploads as videos, not files
- Added tooltip to emoji and attachment buttons
- Fix file/image upload preview layout
- Added tests

## [0.12.0](https://github.com/GetStream/stream-chat-react/releases/tag/v0.12.0) 2020-05-08

- Refactor
- First message in thread doesn't have a fixed position anymore
- Upon if the active channel get's deleted, we now set the active channel to be empty
- Removed some unused css
- Fix for read indicators

## [0.11.18](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.18) 2020-05-06

- Better fallback avatar in ReactionSelector
- Better scrolling after assets finish loading
- Disabled truncation of email links
- New props `onUserClick` and `onUserHover` on `Message` components

## [0.11.17](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.17) 2020-05-04

- Added prop MessageDeleted on Message components to override the default component displayed for deleted messages.

## [0.11.16](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.16) 2020-05-01

- Fixed an where read state indicators dissapeared

## [0.11.15](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.15) 2020-04-30

- Fixed an issue where the read by tooltip said: "x, x, and 0 more"
- Fixed an issue where app might crash due to faulty read state
- Fixed an issue where file attachments didn't get uploaded when also uploading images

## [0.11.14](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.14) 2020-04-29

- Adding direct messaging support for channel preview [b394079](https://github.com/GetStream/stream-chat-react/commit/b39407960fa908dc55b8ea48625f3c7095c37b56)
- Fixed typescript for ChannelList component [576f5c8](https://github.com/GetStream/stream-chat-react/commit/576f5c85919bccf21fc803e917581e373dd241d5)
- Fixed french translation file [308fcab](https://github.com/GetStream/stream-chat-react/commit/308fcab5fa891aad527cf94aeed8353a99d7dcb8)
- Adding extra check for channel connection to avoid failing markRead call [317fb1f](https://github.com/GetStream/stream-chat-react/commit/317fb1fe31e21e253cdce95bfb5d19932f098e2b)

## [0.11.13](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.13) 2020-04-20

- Add check to fix optional activeChannel in ChannelPreview.

## [0.11.12](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.12) 2020-04-17

- Fixing typescript issue with `MessageInput` component prop - `additionalTextAreaProps` [92f2ae2](https://github.com/GetStream/stream-chat-react/commit/92f2ae29a3c66a683ea2b1ebd1c85854cfa41446)

## [0.11.11](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.11) 2020-04-15

- Adding missing translation key `{{ imageCount }} more` in Gallery component [5cea938](https://github.com/GetStream/stream-chat-react/commit/5cea938c5e80e781ae815f461e833f0b61b1a110)

## [0.11.10](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.10) 2020-04-09

- Fix crashing app when there's no active channel

## [0.11.9](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.9) 2020-04-09

- Fix issue with DateSeparator
- added type definition for setActiveChannelOnMount

## [0.11.8](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.8) 2020-04-08

- Fix bug in ChannelHeader caused in version `0.11.4`

## [0.11.6](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.6) 2020-04-04

**NOTE** Please make sure to use `stream-chat@^1.7.0`

- Fixing moderator, owner, admin checks for message actions [71b3309](https://github.com/GetStream/stream-chat-react/commit/71b3309f53edd03a9eded293b3d77093be6359d5)

## [0.11.5](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.5) 2020-04-03

- Open url attachments in new tab [e6436fe](https://github.com/GetStream/stream-chat-react/commit/e6436fe2c8c09bba42ec3677771191e5acbf5d93)

## [0.11.4](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.4) 2020-04-02

- Reworked the mobile nav behaviour to be more flexible

## [0.11.3](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.3) 2020-04-02

- Have the mute action respect channel settings
- Add supported markdown to docs

## [0.11.1](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.1) 2020-03-27

- Reverting optimistic reaction UI related changes

  Reverted commits:

  - [36f8fd0](https://github.com/GetStream/stream-chat-react/commit/36f8fd025f1f8f5bf8c825ba86c141893d69b662)
  - [393c3a5](https://github.com/GetStream/stream-chat-react/commit/393c3a5fb6d31bd5abf24af69b522a85f573e77f)

  Reason: Please check the changelog for [v1.6.1](https://github.com/GetStream/stream-chat-js/blob/master/CHANGELOG.md#march-27-2020---161) stream-chat-js

## [0.11.0](https://github.com/GetStream/stream-chat-react/releases/tag/v0.11.0) 2020-03-27

- Improvements to reaction UX: Updating UI optimistically instead of waiting for reaction api
  call to succeed
  - [36f8fd0](https://github.com/GetStream/stream-chat-react/commit/36f8fd025f1f8f5bf8c825ba86c141893d69b662)
  - [393c3a5](https://github.com/GetStream/stream-chat-react/commit/393c3a5fb6d31bd5abf24af69b522a85f573e77f)
- Fix for a bug: Flagging a message results in "`t is not a function`" error in console
  - commit [d537e78](https://github.com/GetStream/stream-chat-react/commit/d537e787b624b11f8f97f90075afe6f824be025e)
  - fixes issue [#181](https://github.com/GetStream/stream-chat-react/issues/181#issuecomment-604283175)
- Adding support for `additionalTextareaProps` prop in MessageInput component
  - [5346f54](https://github.com/GetStream/stream-chat-react/commit/5346f548f9080d2b178b7ad215425361d433f95f)
  - [a6719bb](https://github.com/GetStream/stream-chat-react/commit/a6719bb8dc0b9209c45653c5b6fe6fe0e5e8bf32)
- Filter out buggy emojis and updating emoji-mart [333ed77](https://github.com/GetStream/stream-chat-react/commit/333ed77ad7d4ebe5dbb2a80052ac3292eeb5e3ee)
- Displaying DateSeperator before deleted messages. So far we didn't show it [8ed3ca5](https://github.com/GetStream/stream-chat-react/commit/8ed3ca508cdb3561d645455c7529d9ea7dceea9f)
- Updating `stream-chat` version to 1.6.0 [d4b7c14](https://github.com/GetStream/stream-chat-react/commit/d4b7c143ae7e4d36fe8e76d1cf9fde78c1a1dc39)

## [0.10.2](https://github.com/GetStream/stream-chat-react/releases/tag/v0.10.2) 2020-03-26

- Bug fix - making sure translators are ready before rendering Chat component [1b0c07a65b88075d14b038977d42138ec7fdaa21](https://github.com/GetStream/stream-chat-react/commit/1b0c07a65b88075d14b038977d42138ec7fdaa21) Fixes [#181](https://github.com/GetStream/stream-chat-react/issues/181)
- Fixing small styling issues with MessageInput
  - [a17300e](https://github.com/GetStream/stream-chat-react/commit/a17300e5a9b8cdcf6ba03c6260679dda3269c812)
  - [0f0bf0a](https://github.com/GetStream/stream-chat-react/commit/0f0bf0a304fdcea498878c9ab501dc18e63340d4)

## [0.10.1](https://github.com/GetStream/stream-chat-react/releases/tag/v0.10.1) 2020-03-25

- Added missing i18next dependency to dependency list [c7cf11f](https://github.com/GetStream/stream-chat-react/commit/c7cf11f32b5a0346889534387adcb99e06f5d90d)

## [0.10.0](https://github.com/GetStream/stream-chat-react/releases/tag/v0.10.0) 2020-03-24

- i18n support for library. Documentatio - https://getstream.github.io/stream-chat-react/#section-streami18n

## [0.9.0](https://github.com/GetStream/stream-chat-react/releases/tag/v0.9.0) 2020-03-21

- 20% bundle size reduction (use day.js instead of moment.js)

## [0.8.8](https://github.com/GetStream/stream-chat-react/releases/tag/v0.8.8) 2020-03-20

- Changing mute success notification to show name of user instead of id - [e5bab26](https://github.com/GetStream/stream-chat-react/commit/e5bab26958e9d3ff5ad53491ed5d964d02f95dab)
- Bug fix: Cancel button on giphy command in thread failed to remove message - [e592a4e](https://github.com/GetStream/stream-chat-react/commit/e592a4e8c8738cd61549b14a40dc317934777ce5)
- Fixing typing indicator to now show up when current user is typing - [c24dc7a](https://github.com/GetStream/stream-chat-react/commit/c24dc7a1ed0ec2b1dada780b32f899b00d59165a)
- Fixing moderator role check function in Message.js - [311fab9](https://github.com/GetStream/stream-chat-react/commit/311fab9efb5bd8ebd90b86c8ed1c2a86db62d6f7)

## [0.8.7](https://github.com/GetStream/stream-chat-react/releases/tag/v0.8.7) 2020-03-19

- Fixed a bug where attachments got duplicated upon submitting an edited message [cb93b92](https://github.com/GetStream/stream-chat-react/commit/cb93b9274c94b1d813c2d061869251cc04f5f610)

## [0.8.6](https://github.com/GetStream/stream-chat-react/releases/tag/v0.8.6) 2020-03-17

- Allow `~~test~~` double tilde for strikethrough in messages - [6870194](https://github.com/GetStream/stream-chat-react/commit/6870194a778f95b3c896d76fa4d4b39e3114c692)
- Fix issue where attachments got duplicated when editing messages - [eea7f61](https://github.com/GetStream/stream-chat-react/commit/eea7f61763359ca8b4dfb13feff294668455643d)

## [0.8.4](https://github.com/GetStream/stream-chat-react/releases/tag/v0.8.4) 2020-02-11

- Fixing `EmptyStateIndicator` prop for ChannelList component - [20d1672](https://github.com/GetStream/stream-chat-react/commit/20d1672969f030bc8f948aea5955706c6dcf757a)

## [0.8.3](https://github.com/GetStream/stream-chat-react/releases/tag/v0.8.3) 2020-02-11

- Fixing `LoadingIndicator` prop for InfiniteScrollPaginator component - [fb81d68](https://github.com/GetStream/stream-chat-react/commit/fb81d68deb2822b9cf2f0414a3d430b86277f024)

## [0.8.2](https://github.com/GetStream/stream-chat-react/releases/tag/v0.8.2) 2020-02-10

- Fixing `LoadingIndicator` prop for ChannelList component - [e6e2e9f](https://github.com/GetStream/stream-chat-react/commit/e6e2e9fdd280d183b4378996c926e4540e467c17)
- Adding `LoadingErrorIndicator` prop for ChannelList component - [e6e2e9f](https://github.com/GetStream/stream-chat-react/commit/e6e2e9fdd280d183b4378996c926e4540e467c17)

## [0.8.1](https://github.com/GetStream/stream-chat-react/releases/tag/v0.8.1) 2020-02-07

- Fixing broken typescript file [cc86f6f](https://github.com/GetStream/stream-chat-react/commit/cc86f6fea998e8581121c7da42870b0c5d316d8c)

## [0.8.0](https://github.com/GetStream/stream-chat-react/releases/tag/v0.8.0) 2020-02-07

- Updated dependencies [dfe466d](https://github.com/GetStream/stream-chat-react/commit/dfe466d43e75b7213857fdf9a6e007ecfc3d4614)
- Exported all the components and updated typescript types - [41e478f](https://github.com/GetStream/stream-chat-react/commit/41e478fc1d37aad8994b9b1075ce9a576a1497f0)

## [0.7.20](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.20) 2020-01-14

- When you change the filters prop on the ChannelList component this now we will refresh the channels with the new query

## [0.7.17](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.17) 2020-01-02

- Added `maxRows` props to MessageInput component

## [0.7.16](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.16) 2020-01-02

- Removed inline styles from multiple locations
- Exporting new component `ChatAutoComplete` (Advanced usage only)

## [0.7.15](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.15) 2019-12-30

- Added the following props on the `Thread` component so the underlying MessageList, MessageInput and Message components can be customized using props:
  - `additionalParentMessageProps`
  - `additionalMessageListProps`
  - `additionalMessageInputProps`
- Added the following props to the `Channel` component:
  - `doUpdateMessageRequest` to override the update(edit) message request (Advanced usage only)
  - `doSendMessageRequest` to override the send message request (Advanced usage only)

## [0.7.13](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.13) 2019-12-03

- Handling and updating channel list on `channel.truncated` and `channel.deleted` event.

## [0.7.12](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.12) 2019-11-22

- Adding prop `MessageSystem` to customize system messages

## [0.7.11](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.11) 2019-11-05

- Fixed z-index issue on MessageInputLarge component https://github.com/GetStream/stream-chat-react/commit/f78b0bf6566fe587da62a8162ab5f1b3d799a10e

## [0.7.10](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.10) 2019-10-16

- Added `customActiveChannel` prop on `ChannelList` to specify a custom channel to be moved to the top and set to active upon mounting.

## [0.7.9](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.9) 2019-10-16

- Changing prop name for MessageSimple from openThread to handleOpenThread.
- Fixing scroll issue on messagelist. Related to issue [#67](https://github.com/GetStream/stream-chat-react/issues/67)

## [0.7.8](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.8) 2019-10-11

- Bug fix with dateseperator in messagelist

## [0.7.7](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.7) 2019-10-11

- Adding intro message to messagelist

## [0.7.6](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.6) 2019-10-08

- Fixed unbinding of visibility listener

## [0.7.5](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.5) 2019-10-07

- Updated js-client with fix for failing fileuploads

## [0.7.4](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.4) 2019-10-07

- Fixed styling issues for SendButton

## [0.7.3](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.3) 2019-10-02

- Added SendButton prop to MessageInput. This only shows on mobile to make sure you're able to submit the form without having a return button.

## [0.7.2](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.2) 2019-09-30

- Updating js-client version

## [0.7.1](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.1) 2019-09-30

- Fix - Adding typescript declaration files in production build

## [0.7.0](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.0) 2019-09-27

- Adding typescript declaration file

## [0.6.27](https://github.com/GetStream/stream-chat-react/releases/tag/v0.6.27) 2019-09-20

- Added `EmptyStateIndicator` prop to [ChannelList](https://getstream.github.io/stream-chat-react/#!/ChannelList) and [MessageList](https://getstream.github.io/stream-chat-react/#!/MessageList)
- Added `watchers` prop to [ChannelList](https://getstream.github.io/stream-chat-react/#!/ChannelList) to specify [watchers pagination query](https://getstream.io/chat/docs/#channel_pagination) on `setActiveChannel`, including this makes one extra query on selecting a channel from the ChannelList
- Updated react-images to version `1.0.0`

## [0.6.26](https://github.com/GetStream/stream-chat-react/releases/tag/v0.6.26) 2019-09-10

- Add IE 11 support for MessageInput
- Fixing pagination issue when oldest message is not received yet
- Fixing issue that didn't display unread count correctly on initial load

## [0.6.25](https://github.com/GetStream/stream-chat-react/releases/tag/v0.6.25) 2019-09-05

- The built in MessageInput components now use native emoji to create consistent rendering between the picker and the message

## [0.6.22](https://github.com/GetStream/stream-chat-react/releases/tag/v0.6.22) 2019-08-15

- Adding support for loading error indicator
- Adding fallback as thumb_url for image attachments

## [0.6.21](https://github.com/GetStream/stream-chat-react/releases/tag/v0.6.21) 2019-08-05

- Syncing and improvements in styleguide

## [0.6.19](https://github.com/GetStream/stream-chat-react/releases/tag/v0.6.19) 2019-07-31

- Fix issue raised in 0.6.17

## [0.6.18](https://github.com/GetStream/stream-chat-react/releases/tag/v0.6.18) 2019-07-31

- Improve message options UX in messaging theme

## [0.6.17](https://github.com/GetStream/stream-chat-react/releases/tag/v0.6.17) 2019-07-30

- Export LoadingChannels component
- Fix connectivity issue with threads
- Better check for user roles

## [0.6.16](https://github.com/GetStream/stream-chat-react/releases/tag/v0.6.16) 2019-07-29

- Adding visual response (notification) for flag message and mute user functionality
- Fixing broken mute user functionality

## [0.6.15](https://github.com/GetStream/stream-chat-react/releases/tag/v0.6.15) 2019-07-23

- Fixing Message actions for livestream and team chat.
- Fixing flag/mute functionality. Earlier only admins were allowed to flag or mute the message. This was wrong. Every user should be able to
  flag or mute any message (other than his own message)

## [0.6.14](https://github.com/GetStream/stream-chat-react/releases/tag/v0.6.14) 2019-07-20

- Adding prop `messageActions` to MessageList

## [0.6.13](https://github.com/GetStream/stream-chat-react/releases/tag/v0.6.13) 2019-07-18

- Adding prop function `onChannelUpdated` as callback for event `channel.updated`
- Bug fix - Channel list component doesn't update when custom data on channel is updated.

## [0.6.0](https://github.com/GetStream/stream-chat-react/releases/tag/v0.6.0) 2019-05-13

- Added Pagination to ChannelList
  - Standard pagination with Load More button (`LoadMorePaginator`)
  - Also includes a infinte scroll paginator (`InfiniteScrollPaginator`)
  - **Important** Because of this change we moved the channelquery logic to `ChannelList` this means you need to pass your `filters`, `sort`, and `options`.

## [0.3.11](https://github.com/GetStream/stream-chat-react/releases/tag/v0.3.11) - 2019-04-23

### Added

- `MessageInput` and `Channel` now accept the following props
  - `multipleUploads={false}`
  - `acceptedFiles={['image/*']}`
  - `maxNumberOfFiles={1}`

## [0.3.10](https://github.com/GetStream/stream-chat-react/releases/tag/v0.3.10) - 2019-04-19

### Added

- Support for @mentions for @mention interactions `Channel` now accepts the following props
  - `onMentionsHover={(event, user) => console.log(event, user)}`
  - `onMentionsClick={(event, user) => console.log(event, user)}`
