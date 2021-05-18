The ChannelStateContext provides the following properties:

- **acceptedFiles** An string array of accepted files for the Channel

- **channel** The currently active channel

-  **emojiConfig** The configuration for Emojis

-  **error** Error object (if any) in loading the channel, otherwise null

-  **hasMore** If the channel has more messages to paginate through

-  **loading**  Boolean for the channel loading state

-  **loadingMore** Boolean for the channel loading more messages

-  **maxNumberOfFiles** The max number of files in a Channel

-  **members** Members of this channel (members are permanent, watchers are users who are online right now)

-  **messages** Array of [message objects](https://getstream.io/chat/docs/javascript/message_format/?language=javascript)

-  **multipleUploads** Boolean showing whether there are multiple uploads

-  **mutes** Muted users for a channel

- **notifications** Temporary notifications added to the message list on specific user/message actions

-  **pinnedMessages** Part of ChannelState - the messages that are pinned in the Channel

- **quotedMessage** An inline message reply to another message.

-  **read** The read state for each channel member

-  **thread** The parent message for a Thread, if there is one, otherwise null

-  **threadHasMore**  Boolean showing if there are more messages available in current active thread, set to false when the end of pagination is reached

-  **threadLoadingMore** If the thread is currently loading more messages

-  **threadMessages** Array of messages within a Thread

-  **watcherCount** The number of watchers on the Channel

-  **watchers** An array of users who are currently watching the channel

-  **watcher_count** The number of watchers on the Channel