# Changelog

## [0.7.17](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.17) 2019-01-02

- Added `maxRows` props to MessageInput component

## [0.7.16](https://github.com/GetStream/stream-chat-react/releases/tag/v0.7.16) 2019-01-02

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
