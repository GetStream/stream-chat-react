The channel context provides the following properties:

- **client** The Client connection

- **closeMobileNav** The function to close mobile navigation

- **mutes** An array of muted users

- **openMobileNav** A function to open mobile navigation

- **setActiveChannel** A function to set the currently active channel. This is used in [ChannelList](#channellist) component to navigate between channels.

- **theme** The current theme

- **useImageFlagEmojisOnWindow**  Replaces flag emojis with images on Windows, defaults to false

- **channel** The currently active channel

- **navOpen** A boolean if navigation is open

  **Params**

  - `newChannel` Channel that needs to be set as active Channel
  - `watchers` watcher parameters: { limit?: number; offset?: number }
  - `event`
