The ChannelStateContext provides the following properties:

- **acceptedFiles** An string array of accepted files for the Channel

- **channel** The currently active channel

-  **emojiConfig** The configuration for Emojis

-  **error** Part of ChannelState - error object (if any) in loading the channel, otherwise null

-  **hasMore** Part of ChannelState - if the channel has more messages to paginate through

-  **loading** Part of ChannelState - boolean for if the channel is currently loading

-  **loadingMore** Part of ChannelState - if the channel is loading pagination

-  **maxNumberOfFiles** The max number of files in a Channel

-  **members** Part of ChannelState - members of this channel (members are permanent, watchers are users who are online right now)

-  **messages** Part of ChannelState - List of [message objects](https://getstream.io/chat/docs/javascript/message_format/?language=javascript)

-  **multipleUploads** Boolean showing whether there are multiple uploads

-  **mutes** Muted users

-  **pinnedMessages** Part of ChannelState - the messages that are pinned in the Channel

-  **read** Part of ChannelState - the read state for each user

-  **thread** Part of ChannelState - a message if it's a Thread, if there is one, otherwise null

-  **threadHasMore** Part of ChannelState - boolean showing if there are more messages available in current active thread, set to false when the end of pagination is reached

-  **threadLoadingMore** Part of ChannelState - if the thread is currently loading more messages

-  **threadMessages** Part of ChannelState - array of Messages with a Thread has more replies

-  **typing** Part of ChannelState - typing [event object](https://getstream.io/chat/docs/javascript/event_object/?language=javascript) (where event type is `typing.start`)

-  **watcherCount** The number of watchers on the Channel

-  **watchers** Part of ChannelState - An array of users who are currently watching the channel

-  **watcher_count** Count of watchers