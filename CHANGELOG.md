# Changelog

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
