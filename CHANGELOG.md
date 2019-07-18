# Changelog

## [0.6.13] 2019-07-18

- Adding prop function `onChannelUpdated` as callback for event `channel.updated`
- Bug fix - Channel list component doesn't update when custom data on channel is updated.

## [0.6.0] 2019-05-13

- Added Pagination to ChannelList
  - Standard pagination with Load More button (`LoadMorePaginator`)
  - Also includes a infinte scroll paginator (`InfiniteScrollPaginator`)
  - **Important** Because of this change we moved the channelquery logic to `ChannelList` this means you need to pass your `filters`, `sort`, and `options`.

## [0.3.11] - 2019-04-23

### Added

- `MessageInput` and `Channel` now accept the following props
  - `multipleUploads={false}`
  - `acceptedFiles={['image/*']}`
  - `maxNumberOfFiles={1}`

## [0.3.10] - 2019-04-19

### Added

- Support for @mentions for @mention interactions `Channel` now accepts the following props
  - `onMentionsHover={(event, user) => console.log(event, user)}`
  - `onMentionsClick={(event, user) => console.log(event, user)}`
