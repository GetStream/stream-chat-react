The channel context provides the following properties:

- **client** The Client connection
- **theme** The current theme
- **channel** The currently active channel
- **closeMobileNav** The function to close mobile navigation
- **mutes** An array of muted users
- **navOpen** A boolean if navigation is open
- **openMobileNav** A function to open mobile navigation
- **setActiveChannel** A function to set the currently active channel. This is used in [ChannelList](#channellist) component to navigate between channels.

  **Params**

  - `newChannel` Channel that needs to be set as active Channel
  - `watchers` water parameters: { limit?: number; offset?: number }
  - `event`
