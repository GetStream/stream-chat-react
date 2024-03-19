## [11.12.0](https://github.com/GetStream/stream-chat-react/compare/v11.11.0...v11.12.0) (2024-03-07)


### Features

* add message edited timestamp ([#2304](https://github.com/GetStream/stream-chat-react/issues/2304)) ([5633614](https://github.com/GetStream/stream-chat-react/commit/56336142618564152ee7047df5ba00749c93507a))
* voice recording message attachment ([#2311](https://github.com/GetStream/stream-chat-react/issues/2311)) ([024ba6c](https://github.com/GetStream/stream-chat-react/commit/024ba6c1df39d6e57bfac1a6692fbf1306fdf173))

## [11.11.0](https://github.com/GetStream/stream-chat-react/compare/v11.10.0...v11.11.0) (2024-03-01)


### Bug Fixes

* cleanup ML types and defaults ([#2305](https://github.com/GetStream/stream-chat-react/issues/2305)) ([b3ed81d](https://github.com/GetStream/stream-chat-react/commit/b3ed81dd7a99ed32fb47c81a7b4e0b8e41f6d823))


### Features

* introduce useCreateChatClient hook ([#1916](https://github.com/GetStream/stream-chat-react/issues/1916)) ([e086565](https://github.com/GetStream/stream-chat-react/commit/e08656592f635f25dc7f94bd1e6ec02c6d4c31d2)), closes [GetStream/stream-chat-react-issues#19](https://github.com/GetStream/stream-chat-react-issues/issues/19)

## [11.10.0](https://github.com/GetStream/stream-chat-react/compare/v11.9.0...v11.10.0) (2024-02-23)


### Bug Fixes

* initial message load issues ([#2292](https://github.com/GetStream/stream-chat-react/issues/2292)) ([3685030](https://github.com/GetStream/stream-chat-react/commit/36850305435757090f28d63bed4306ec9d7481e1))


### Features

* add customizable reaction details sorting ([#2290](https://github.com/GetStream/stream-chat-react/issues/2290)) ([652e3a5](https://github.com/GetStream/stream-chat-react/commit/652e3a53ebe38ca66766687b35f370582307d279)), closes [#2289](https://github.com/GetStream/stream-chat-react/issues/2289)
* add customizable reactions sorting ([#2289](https://github.com/GetStream/stream-chat-react/issues/2289)) ([78c6107](https://github.com/GetStream/stream-chat-react/commit/78c6107e6437a1761f3b3e69f44c5c80979c88b1))

## [11.9.0](https://github.com/GetStream/stream-chat-react/compare/v11.8.0...v11.9.0) (2024-02-21)


### Bug Fixes

* add aria-expanded attribute to emoji picker and reactions selector ([#2274](https://github.com/GetStream/stream-chat-react/issues/2274)) ([b15cdd5](https://github.com/GetStream/stream-chat-react/commit/b15cdd572004b0a7abf3623dbb66782fcede9f80))
* mark channel read on scroll to bottom of the main message list ([#2283](https://github.com/GetStream/stream-chat-react/issues/2283)) ([d04d0ab](https://github.com/GetStream/stream-chat-react/commit/d04d0ab6a08cf52c5fc55fadcb2687b23f5ab312))
* prevent layout shifts in reactions modal ([#2272](https://github.com/GetStream/stream-chat-react/issues/2272)) ([706cf3d](https://github.com/GetStream/stream-chat-react/commit/706cf3ddf9d4329b869f8058f041ec6595b51a9e))
* trap focus in opened modal ([#2278](https://github.com/GetStream/stream-chat-react/issues/2278)) ([8f48b52](https://github.com/GetStream/stream-chat-react/commit/8f48b52f8efbf91a5bf355beff36c151390102d8))


### Features

* make aria-labels localizable ([#2282](https://github.com/GetStream/stream-chat-react/issues/2282)) ([7867677](https://github.com/GetStream/stream-chat-react/commit/7867677f2b17d3649324cc80f43c459e9b30bf95)), closes [#1931](https://github.com/GetStream/stream-chat-react/issues/1931) [#1994](https://github.com/GetStream/stream-chat-react/issues/1994)

## [11.8.0](https://github.com/GetStream/stream-chat-react/compare/v11.7.0...v11.8.0) (2024-02-13)


### Bug Fixes

* adjust the first message rendering for DateSeparator in empty VirtualizedMessageList ([#2271](https://github.com/GetStream/stream-chat-react/issues/2271)) ([8f490fa](https://github.com/GetStream/stream-chat-react/commit/8f490fa292cc2d41a49d1f2a94b22aa8feb53fe3))
* export DefaultStreamChatGenerics ([#2266](https://github.com/GetStream/stream-chat-react/issues/2266)) ([6a928f6](https://github.com/GetStream/stream-chat-react/commit/6a928f68261f3e3f67182a8658c7fc9ae6572814))
* prevent mine attr from spreading on message actions box div ([#2270](https://github.com/GetStream/stream-chat-react/issues/2270)) ([1625471](https://github.com/GetStream/stream-chat-react/commit/16254718d59754ae03dde93ea10abaacdff6e31d))
* remove mark read functionality from ChannelPreview ([#2273](https://github.com/GetStream/stream-chat-react/issues/2273)) ([3be1ec5](https://github.com/GetStream/stream-chat-react/commit/3be1ec5d94d49f871c12e51804b97418c1d8cfc9))


### Features

* implement message bounce flow ([#2254](https://github.com/GetStream/stream-chat-react/issues/2254)) ([3878e2f](https://github.com/GetStream/stream-chat-react/commit/3878e2f3148f70dd78da623da3c4b3f2ee012cb7))
* keep unread channel UI when unread channel is marked read on mount ([#2267](https://github.com/GetStream/stream-chat-react/issues/2267)) ([2abe352](https://github.com/GetStream/stream-chat-react/commit/2abe352839e89e4899dec469f9de3b0f1cc109c3))

## [11.7.0](https://github.com/GetStream/stream-chat-react/compare/v11.6.0...v11.7.0) (2024-02-07)


### Bug Fixes

* show UnreadMessagesNotification when MessageList is scrolled to bottom via Element.scrollTo ([#2261](https://github.com/GetStream/stream-chat-react/issues/2261)) ([b51f846](https://github.com/GetStream/stream-chat-react/commit/b51f8466cbfabe885352b2d6094ba8a5d9436429))


### Features

* allow to pass custom function customQueryChannels to ChannelList to query channels ([#2260](https://github.com/GetStream/stream-chat-react/issues/2260)) ([5dfa493](https://github.com/GetStream/stream-chat-react/commit/5dfa493fcdd80c615c17fb674a691521f6456102))

## [11.6.0](https://github.com/GetStream/stream-chat-react/compare/v11.5.0...v11.6.0) (2024-02-07)


### Bug Fixes

* avatar alignment ([#2264](https://github.com/GetStream/stream-chat-react/issues/2264)) ([1c88fdd](https://github.com/GetStream/stream-chat-react/commit/1c88fdd766f8c995271e0c5c6f5d2c31783dbac4)), closes [#2263](https://github.com/GetStream/stream-chat-react/issues/2263)


### Features

* use lint-staged for lint and fixes ([#2258](https://github.com/GetStream/stream-chat-react/issues/2258)) ([9ce6c66](https://github.com/GetStream/stream-chat-react/commit/9ce6c66941b0cc7eece2a3e9b7da038b72acf83f))

## [11.5.0](https://github.com/GetStream/stream-chat-react/compare/v11.4.0...v11.5.0) (2024-02-02)


### Features

* mark channel unread ([#2238](https://github.com/GetStream/stream-chat-react/issues/2238)) ([8f87b2b](https://github.com/GetStream/stream-chat-react/commit/8f87b2b2db9aab8cab2c4fbc634bafe5974b3fcc))
* show full list of reactions in a modal ([#2249](https://github.com/GetStream/stream-chat-react/issues/2249)) ([0ebdbc6](https://github.com/GetStream/stream-chat-react/commit/0ebdbc62bc263c9ce7f0150b3c2ab6d488132807))

## [11.4.0](https://github.com/GetStream/stream-chat-react/compare/v11.3.0...v11.4.0) (2024-01-24)


### Bug Fixes

* get rid of positioning wrapper for message actions box ([#2246](https://github.com/GetStream/stream-chat-react/issues/2246)) ([32c0180](https://github.com/GetStream/stream-chat-react/commit/32c01806d6755e8402740b9828269845330153f0)), closes [#2241](https://github.com/GetStream/stream-chat-react/issues/2241) [#2241](https://github.com/GetStream/stream-chat-react/issues/2241)
* hasMore limitations ([#2242](https://github.com/GetStream/stream-chat-react/issues/2242)) ([24e294b](https://github.com/GetStream/stream-chat-react/commit/24e294be85dd2384eef0c646481d4f6e5cdd18a6))
* use popper to properly position message actions box ([#2241](https://github.com/GetStream/stream-chat-react/issues/2241)) ([651d3e7](https://github.com/GetStream/stream-chat-react/commit/651d3e727abe52a1e2650be54375ede06cc51904))


### Features

* allow overriding the way MessageList renders messages ([#2243](https://github.com/GetStream/stream-chat-react/issues/2243)) ([dba63e8](https://github.com/GetStream/stream-chat-react/commit/dba63e8ac515a1e455429c257a963313b15e42f4))
* enable exhaustive-deps, but ignore all current errors ([#2244](https://github.com/GetStream/stream-chat-react/issues/2244)) ([d07861f](https://github.com/GetStream/stream-chat-react/commit/d07861ffddbf151fc4e98940490e4348845bd491))

## [11.3.0](https://github.com/GetStream/stream-chat-react/compare/v11.2.1...v11.3.0) (2024-01-09)


### Features

* add CustomMessageActionsList to ComponentContext ([#2226](https://github.com/GetStream/stream-chat-react/issues/2226)) ([2c6e56c](https://github.com/GetStream/stream-chat-react/commit/2c6e56c6c709bdd25ec97435b7b82c64a0b26580))


### Chores

* **deps:** pin react-markdown to v9.0.1 ([#2229](https://github.com/GetStream/stream-chat-react/issues/2229)) ([61213d7](https://github.com/GetStream/stream-chat-react/commit/61213d72f4d061aa4536d468b38017f7aa4856dc))

## [11.2.1](https://github.com/GetStream/stream-chat-react/compare/v11.2.0...v11.2.1) (2023-12-21)


### Chores

* **deps:** add @babel/runtime to dependencies ([#2219](https://github.com/GetStream/stream-chat-react/issues/2219)) ([c9f5844](https://github.com/GetStream/stream-chat-react/commit/c9f584486cab1d6308f90feea9fead04cc909ede)), closes [#2218](https://github.com/GetStream/stream-chat-react/issues/2218)

## [11.2.0](https://github.com/GetStream/stream-chat-react/compare/v11.1.2...v11.2.0) (2023-12-20)


### Bug Fixes

* update MessageInput icons to include viewBox property ([#2220](https://github.com/GetStream/stream-chat-react/issues/2220)) ([df8988e](https://github.com/GetStream/stream-chat-react/commit/df8988eabe15357a78b860526041a8284023b7f0))


### Features

* handle message.new events in ChannelList with custom handler onMessageNewHandler ([#2221](https://github.com/GetStream/stream-chat-react/issues/2221)) ([7ffeeaf](https://github.com/GetStream/stream-chat-react/commit/7ffeeaf1279c46f8ae3c0ea6fbc8f831b2f159f9))

## [11.1.2](https://github.com/GetStream/stream-chat-react/compare/v11.1.1...v11.1.2) (2023-12-13)


### Bug Fixes

* disable SuggestionList during text composition ([#2205](https://github.com/GetStream/stream-chat-react/issues/2205)) ([614bc99](https://github.com/GetStream/stream-chat-react/commit/614bc996a51e1498003c52810ffcad545cbd1895))
* mark as read messages sent by current user ([#2211](https://github.com/GetStream/stream-chat-react/issues/2211)) ([38f2363](https://github.com/GetStream/stream-chat-react/commit/38f2363085216c6eaf525592e8d7ee827b392e14))
* schedule cooldown removal from useCooldownTimer hook instead of CooldownTimer ([#2208](https://github.com/GetStream/stream-chat-react/issues/2208)) ([9523b45](https://github.com/GetStream/stream-chat-react/commit/9523b45ac6e8969f257cccf33ac4c6a76f8cc4e6))
* show image fallbacks in image gallery modal ([#2212](https://github.com/GetStream/stream-chat-react/issues/2212)) ([5ac95a1](https://github.com/GetStream/stream-chat-react/commit/5ac95a1bf5c0b78bc4e401c3378ebe28fa710541))


### Chores

* **deps:** bump @stream-io/stream-chat-css from v4.1.0 to v4.2.0 ([ff554ad](https://github.com/GetStream/stream-chat-react/commit/ff554adfe8c016e7667c3669970068e52097db6a))

## [11.1.1](https://github.com/GetStream/stream-chat-react/compare/v11.1.0...v11.1.1) (2023-12-05)


### Bug Fixes

* **VML:** prevent recalculation of prepended items when messages are swapped due to status change ([#2203](https://github.com/GetStream/stream-chat-react/issues/2203)) ([565e2f9](https://github.com/GetStream/stream-chat-react/commit/565e2f9af9b201d8048c2fb91e005ade99011990))

## [11.1.0](https://github.com/GetStream/stream-chat-react/compare/v11.0.0...v11.1.0) (2023-12-01)


### Bug Fixes

* revert "feat: expose channels state on chat level ([#2161](https://github.com/GetStream/stream-chat-react/issues/2161))" ([#2184](https://github.com/GetStream/stream-chat-react/issues/2184)) ([32e4867](https://github.com/GetStream/stream-chat-react/commit/32e4867032414d11d1946f6a33a9d0e5aeebbde8))


### Features

* add BaseImage component with image fallback display ([#2183](https://github.com/GetStream/stream-chat-react/issues/2183)) ([ec1d79b](https://github.com/GetStream/stream-chat-react/commit/ec1d79bb4acc64bc5c1542d847d541ad104dbed2))
* add channel list context ([#2187](https://github.com/GetStream/stream-chat-react/issues/2187)) ([fd5ea67](https://github.com/GetStream/stream-chat-react/commit/fd5ea6718712cdc0ff5fdbe3d4180d1eccb292cc))
* render BaseImage image fallback within the same img element ([#2200](https://github.com/GetStream/stream-chat-react/issues/2200)) ([2fcd564](https://github.com/GetStream/stream-chat-react/commit/2fcd5644f55eed77537cc4a856dbe1b6cbebde3f))


### Chores

* **deps:** bump @stream-io/stream-chat-css from 4.0.0 to 4.1.0 ([e600e3c](https://github.com/GetStream/stream-chat-react/commit/e600e3cb03e7523f97b26ca2aa71167b1a40c807))
* **deps:** bump stream-chat from 8.14.3 to 8.14.4 ([#2199](https://github.com/GetStream/stream-chat-react/issues/2199)) ([a4dd57f](https://github.com/GetStream/stream-chat-react/commit/a4dd57f592f91bfcd33ba73c72cc1254e984d8e5))
* **deps:** move `@stream-io/stream-chat-css` to `devDeps` ([#2191](https://github.com/GetStream/stream-chat-react/issues/2191)) ([61af19c](https://github.com/GetStream/stream-chat-react/commit/61af19cd1b142dc45c07023825d323dd7b78e5d5))

## [11.0.0](https://github.com/GetStream/stream-chat-react/compare/v10.20.1...v11.0.0) (2023-11-27)


### ⚠ BREAKING CHANGES

* **emoji-mart:** `EmojiPicker` & `EmojiIndex` signatures changed, `EmojiIndex` has been renamed to `emojiSearchIndex`, both `EmojiPicker` & `emojiSearchIndex` are now optional, see [release guide](https://github.com/GetStream/stream-chat-react/blob/v11.0.0/docusaurus/docs/React/release-guides/upgrade-to-v11.mdx) for more information
* **emoji-mart:** `useImageFlagEmojisOnWindow` flag now requires extra style sheet import, see [release guide](https://github.com/GetStream/stream-chat-react/blob/v11.0.0/docusaurus/docs/React/release-guides/upgrade-to-v11.mdx) for more information
* **emoji-mart:** `reactionOptions` signature has changed, see [release guide](https://github.com/GetStream/stream-chat-react/blob/v11.0.0/docusaurus/docs/React/release-guides/upgrade-to-v11.mdx) for more information
* the first argument to `doSendMessageRequest` is now Channel instance instead of `Channel.cid`
* apply the remark plugins `keepLineBreaksPlugin`, `htmlToTextPlugin` as a part of the default message text parsing, upgrade `unified` libraries

### Bug Fixes

* **emoji-mart:** new reactions  ([#1947](https://github.com/GetStream/stream-chat-react/issues/1947)) ([14bef23](https://github.com/GetStream/stream-chat-react/commit/14bef231424cbd98f1c568be35ca9ce3bb9c98f9)), closes [#1935](https://github.com/GetStream/stream-chat-react/issues/1935) [#1637](https://github.com/GetStream/stream-chat-react/issues/1637) [#1437](https://github.com/GetStream/stream-chat-react/issues/1437) [#2159](https://github.com/GetStream/stream-chat-react/issues/2159)
* **emoji-mart:** simplify EmojiPicker & emojiSearchIndex ([#2117](https://github.com/GetStream/stream-chat-react/issues/2117)) ([a6e0a87](https://github.com/GetStream/stream-chat-react/commit/a6e0a87eee6d17acff5880f2d0dbeff3b49f8db2)), closes [#2116](https://github.com/GetStream/stream-chat-react/issues/2116) [#2094](https://github.com/GetStream/stream-chat-react/issues/2094)


### Features

* apply keepLineBreaksPlugin & htmlToTextPlugin plugins to text rendering by default ([#2169](https://github.com/GetStream/stream-chat-react/issues/2169)) ([e8047f2](https://github.com/GetStream/stream-chat-react/commit/e8047f2e5bfe11e8569fce6b5ded35139b7e3c04)), closes [#2170](https://github.com/GetStream/stream-chat-react/issues/2170) [/github.com/GetStream/stream-chat-react/blob/f0bc7ba2532760cabb1db01e685a35bd3b0b64c5/src/components/Message/renderText/renderText.tsx#L158](https://github.com/GetStream//github.com/GetStream/stream-chat-react/blob/f0bc7ba2532760cabb1db01e685a35bd3b0b64c5/src/components/Message/renderText/renderText.tsx/issues/L158)
* export MessageListNotifications and LinkPreviewList components and component props ([#2181](https://github.com/GetStream/stream-chat-react/issues/2181)) ([a5a7e5a](https://github.com/GetStream/stream-chat-react/commit/a5a7e5aef8ea9432a948137b070a80b2898b8d32))
* require Channel instance as the first argument to doSendMessageRequest ([#2171](https://github.com/GetStream/stream-chat-react/issues/2171)) ([2a06b88](https://github.com/GetStream/stream-chat-react/commit/2a06b88d6fdea7a9205c798397c91301fee09916))


### Chores

* **deps:** bump stream-chat from 8.14.0 to 8.14.2 ([#2179](https://github.com/GetStream/stream-chat-react/issues/2179)) ([4e6a59d](https://github.com/GetStream/stream-chat-react/commit/4e6a59dd3bcb044b091c1deb0470ba136f9155d9))
* **deps:** bump stream-chat from 8.14.2 to 8.14.3 ([#2185](https://github.com/GetStream/stream-chat-react/issues/2185)) ([3dd8dab](https://github.com/GetStream/stream-chat-react/commit/3dd8dab51bfab8a9a6e10bb83ef3752780930899))

## [10.20.1](https://github.com/GetStream/stream-chat-react/compare/v10.20.0...v10.20.1) (2023-11-20)


### Bug Fixes

* calculate pagination stop from custom channel query message limit ([#2180](https://github.com/GetStream/stream-chat-react/issues/2180)) ([8374af1](https://github.com/GetStream/stream-chat-react/commit/8374af1048b81c307d0687d7730df6a96633b7e6))

## [10.20.0](https://github.com/GetStream/stream-chat-react/compare/v10.19.0...v10.20.0) (2023-11-16)


### Bug Fixes

* lift notifications above modal overlay ([#2175](https://github.com/GetStream/stream-chat-react/issues/2175)) ([17d98f4](https://github.com/GetStream/stream-chat-react/commit/17d98f40eaea0a134a501deea14605b71d965871))


### Features

* allow to configure channel query options ([#2177](https://github.com/GetStream/stream-chat-react/issues/2177)) ([4f91d9a](https://github.com/GetStream/stream-chat-react/commit/4f91d9a65e752f4bcab2000f5d633b57ae4d6b0e))

## [10.19.0](https://github.com/GetStream/stream-chat-react/compare/v10.18.0...v10.19.0) (2023-11-14)


### Features

* expose optional remark plugin to keep all line breaks and keep HTML in message text ([#2170](https://github.com/GetStream/stream-chat-react/issues/2170)) ([5b191c9](https://github.com/GetStream/stream-chat-react/commit/5b191c94de6ec4ff483be65b15ea00e754e0eb47))
* introduce MessageListContext ([#2166](https://github.com/GetStream/stream-chat-react/issues/2166)) ([8dcb1ac](https://github.com/GetStream/stream-chat-react/commit/8dcb1acd5e8e3465d6b457b07f5de2923ac2daed))

## [10.18.0](https://github.com/GetStream/stream-chat-react/compare/v10.17.0...v10.18.0) (2023-11-07)


### Features

* expose channels state on chat level ([#2161](https://github.com/GetStream/stream-chat-react/issues/2161)) ([7e5543b](https://github.com/GetStream/stream-chat-react/commit/7e5543b3bf3961900c17e8a9283dfc64611f8660))

## [10.17.0](https://github.com/GetStream/stream-chat-react/compare/v10.16.2...v10.17.0) (2023-11-07)


### Bug Fixes

* **i18n:** add missing SDK translations ([#2157](https://github.com/GetStream/stream-chat-react/issues/2157)) ([e22a6ce](https://github.com/GetStream/stream-chat-react/commit/e22a6ceeb0116a0b8b1b963c1736c5ae7c0debcc))


### Features

* add Channel prop doDeleteMessageRequest ([#2152](https://github.com/GetStream/stream-chat-react/issues/2152)) ([a01774a](https://github.com/GetStream/stream-chat-react/commit/a01774aa3a02b3a92a01a7c6bd5f98b49507dfbd))

## [10.16.2](https://github.com/GetStream/stream-chat-react/compare/v10.16.1...v10.16.2) (2023-11-03)


### Bug Fixes

* **i18n:** do not translate command names ([#2155](https://github.com/GetStream/stream-chat-react/issues/2155)) ([b654b9a](https://github.com/GetStream/stream-chat-react/commit/b654b9a20edc2968d5c9460c3db791d05fcd8ab3))

## [10.16.1](https://github.com/GetStream/stream-chat-react/compare/v10.16.0...v10.16.1) (2023-11-03)


### Bug Fixes

* **i18n:** prevent removal of dynamically generated translation keys ([#2154](https://github.com/GetStream/stream-chat-react/issues/2154)) ([ebcaa8f](https://github.com/GetStream/stream-chat-react/commit/ebcaa8f4872a94f94d0ee3841367b92ab5263959))

# [10.16.0](https://github.com/GetStream/stream-chat-react/compare/v10.15.0...v10.16.0) (2023-10-31)


### Bug Fixes

* prevent flashing EmptyStateIndicator in ChannelList before the first channels page is loaded ([#2150](https://github.com/GetStream/stream-chat-react/issues/2150)) ([a2a9645](https://github.com/GetStream/stream-chat-react/commit/a2a964513e400b62f800b118433f1d5d671b557d))


### Features

* add commands translations ([#2149](https://github.com/GetStream/stream-chat-react/issues/2149)) ([f55c86f](https://github.com/GetStream/stream-chat-react/commit/f55c86fab8dcbfd2fb3b68aaa912e31e8c5fbe67))

# [10.15.0](https://github.com/GetStream/stream-chat-react/compare/v10.14.1...v10.15.0) (2023-10-25)


### Features

* **renderText:** allow custom remark and rehype plugin composition ([#2142](https://github.com/GetStream/stream-chat-react/issues/2142)) ([4a25912](https://github.com/GetStream/stream-chat-react/commit/4a259125a41d49d50473b6f0edc89a9f56d21ea6))
* **VirtualizedMessageList:** allow to merge custom virtuoso components with the SDK defaults ([#2140](https://github.com/GetStream/stream-chat-react/issues/2140)) ([6ea9ff0](https://github.com/GetStream/stream-chat-react/commit/6ea9ff0ca01782ec1b4ceffffb74d9fa9a2fdc1c))

## [10.14.1](https://github.com/GetStream/stream-chat-react/compare/v10.14.0...v10.14.1) (2023-10-19)


###
* chore(deps): bump stream-chat from 8.12.4 to 8.13.1

# [10.14.0](https://github.com/GetStream/stream-chat-react/compare/v10.13.1...v10.14.0) (2023-10-11)


### Features

* allow complete channel list throttled reload on internet connection recovery ([#2123](https://github.com/GetStream/stream-chat-react/issues/2123)) ([252cac3](https://github.com/GetStream/stream-chat-react/commit/252cac3366986523b9f6b1152c9408ccab0af710))

## [10.13.1](https://github.com/GetStream/stream-chat-react/compare/v10.13.0...v10.13.1) (2023-10-09)

# [10.13.0](https://github.com/GetStream/stream-chat-react/compare/v10.12.0...v10.13.0) (2023-10-06)


### Bug Fixes

* on pagination keep a unique list of channels in the ChannelList ([#2115](https://github.com/GetStream/stream-chat-react/issues/2115)) ([11173e1](https://github.com/GetStream/stream-chat-react/commit/11173e14e00a92cbfa38cc7f5f19e1a02b6e37a2))


### Features

* add initializeOnMount prop to ChannelProps ([#2113](https://github.com/GetStream/stream-chat-react/issues/2113)) ([db18efd](https://github.com/GetStream/stream-chat-react/commit/db18efddfee4fe666997ea691c0d9d07d766cc46))
* allow to conditionally display MessageInput's send button through MessageInputProps ([#2109](https://github.com/GetStream/stream-chat-react/issues/2109)) ([cd07418](https://github.com/GetStream/stream-chat-react/commit/cd074181d3807587295133f7757a99f1bf5da801))

# [10.12.0](https://github.com/GetStream/stream-chat-react/compare/v10.11.0...v10.12.0) (2023-09-29)


### Features

* add messageDeliveryStatus prop to ChannelListPreview ([#2104](https://github.com/GetStream/stream-chat-react/issues/2104)) ([9aa4aea](https://github.com/GetStream/stream-chat-react/commit/9aa4aea6b900839a6de8f1ba49f5846167758614))
* allow to configure the search query debounce interval ([#2107](https://github.com/GetStream/stream-chat-react/issues/2107)) ([d563369](https://github.com/GetStream/stream-chat-react/commit/d5633693f1f087a5e6ad2ba29ccaa1257f9b7d7f))

# [10.11.0](https://github.com/GetStream/stream-chat-react/compare/v10.10.2...v10.11.0) (2023-09-26)


### Bug Fixes

* adjust cooldown interval calculation for messages coming from future ([#2101](https://github.com/GetStream/stream-chat-react/issues/2101)) ([3263f10](https://github.com/GetStream/stream-chat-react/commit/3263f104823caaa00a81de17508ae1ec2c4f5594))
* enable sending reactions to frozen channel with UseFrozenChannel permission ([#2097](https://github.com/GetStream/stream-chat-react/issues/2097)) ([852490d](https://github.com/GetStream/stream-chat-react/commit/852490ddd397097c2bc13308afcc4b2fe9cc1806))


### Features

* add timezone support to datetime parsing ([#2099](https://github.com/GetStream/stream-chat-react/issues/2099)) ([3d4bdf9](https://github.com/GetStream/stream-chat-react/commit/3d4bdf9bd922a16fb3848ac6274ffea11eed8de3))

## [10.10.2](https://github.com/GetStream/stream-chat-react/compare/v10.10.1...v10.10.2) (2023-09-19)


### Bug Fixes

* keep channels initially without id registered for WS events ([#2095](https://github.com/GetStream/stream-chat-react/issues/2095)) ([eba7bbe](https://github.com/GetStream/stream-chat-react/commit/eba7bbef33fe1d85ce6871ba43010b5b0489d032))

## [10.10.1](https://github.com/GetStream/stream-chat-react/compare/v10.10.0...v10.10.1) (2023-09-13)


### Bug Fixes

* export UploadButton /w props type ([#2091](https://github.com/GetStream/stream-chat-react/issues/2091)) ([50e22ba](https://github.com/GetStream/stream-chat-react/commit/50e22baa2e03e8a059b3bf6c7d3bc65edcbfb168))

# [10.10.0](https://github.com/GetStream/stream-chat-react/compare/v10.9.1...v10.10.0) (2023-09-08)


### Features

* add link previews to MessageInput ([#2083](https://github.com/GetStream/stream-chat-react/issues/2083)) ([76caeea](https://github.com/GetStream/stream-chat-react/commit/76caeeac77e42d5286ae6a409cbf93c582b5c1f6))


### Performance Improvements

* **package-size:** remove react-file-utils package ([#2088](https://github.com/GetStream/stream-chat-react/issues/2088)) ([1258e09](https://github.com/GetStream/stream-chat-react/commit/1258e09f252c81295fbaee0da58194886424f0a6))

## [10.9.1](https://github.com/GetStream/stream-chat-react/compare/v10.9.0...v10.9.1) (2023-08-31)


### Bug Fixes

* export ChannelSearchFunctionParams & ChannelSearchParams types ([#2084](https://github.com/GetStream/stream-chat-react/issues/2084)) ([1ef81ea](https://github.com/GetStream/stream-chat-react/commit/1ef81ea602c9b1e817f3bbe2c2dcf5b12e838fee))

# [10.9.0](https://github.com/GetStream/stream-chat-react/compare/v10.8.9...v10.9.0) (2023-08-21)


### Bug Fixes

* keep showing message read receipt once read ([#2080](https://github.com/GetStream/stream-chat-react/issues/2080)) ([6f9fb96](https://github.com/GetStream/stream-chat-react/commit/6f9fb96c3746d1f59291f130bae7621154432b8a))


### Features

* show read receipts in VirtualizedMessageList ([#2076](https://github.com/GetStream/stream-chat-react/issues/2076)) ([e08d972](https://github.com/GetStream/stream-chat-react/commit/e08d972ebbadf460f021b031bd34bd44e31faa16))

## [10.8.9](https://github.com/GetStream/stream-chat-react/compare/v10.8.8...v10.8.9) (2023-08-11)


### Bug Fixes

* remove color code from LoadingIndicator root class ([#2072](https://github.com/GetStream/stream-chat-react/issues/2072)) ([eba171f](https://github.com/GetStream/stream-chat-react/commit/eba171f8a1ff880b79f9d5da62c372d8127d0c26))

## [10.8.8](https://github.com/GetStream/stream-chat-react/compare/v10.8.7...v10.8.8) (2023-07-27)


### Bug Fixes

* prevent remounting Message components in VirtualizedMessageList ([#2067](https://github.com/GetStream/stream-chat-react/issues/2067)) ([17d48b0](https://github.com/GetStream/stream-chat-react/commit/17d48b0f690489ef192acd704a02f1b90c38df79))

## [10.8.7](https://github.com/GetStream/stream-chat-react/compare/v10.8.6...v10.8.7) (2023-07-17)


### Bug Fixes

* namespace the ChannelSearch's root element "inline" and "popup" classes ([#2056](https://github.com/GetStream/stream-chat-react/issues/2056)) ([442e177](https://github.com/GetStream/stream-chat-react/commit/442e17723dbe6731289e51305cc4ba003e533b7e))

## [10.8.6](https://github.com/GetStream/stream-chat-react/compare/v10.8.5...v10.8.6) (2023-07-11)


### Bug Fixes

* enable search results scrolling ([#2041](https://github.com/GetStream/stream-chat-react/issues/2041)) ([e61cabe](https://github.com/GetStream/stream-chat-react/commit/e61cabe457edc50e4fa69dbafc1cea3205885b41))
* prevent ignoring the clearSearchOnClickOutside search param on mobile ([#2039](https://github.com/GetStream/stream-chat-react/issues/2039)) ([e83d313](https://github.com/GetStream/stream-chat-react/commit/e83d313085bff66d8a1bdb8886e61fd85af19692))

## [10.8.5](https://github.com/GetStream/stream-chat-react/compare/v10.8.4...v10.8.5) (2023-06-27)


### Bug Fixes

* make cooldown timer to rely on skip-slow-mode capability  ([#2018](https://github.com/GetStream/stream-chat-react/issues/2018)) ([8f7c79f](https://github.com/GetStream/stream-chat-react/commit/8f7c79f7498a275c5704a891571b5c2728cd6749))

## [10.8.4](https://github.com/GetStream/stream-chat-react/compare/v10.8.3...v10.8.4) (2023-06-22)


### Bug Fixes

* prevent showing original text of deleted quoted message ([#2033](https://github.com/GetStream/stream-chat-react/issues/2033)) ([773d59f](https://github.com/GetStream/stream-chat-react/commit/773d59fc0970f7f3128bd740033556e5c646397d))

## [10.8.3](https://github.com/GetStream/stream-chat-react/compare/v10.8.2...v10.8.3) (2023-06-12)


### Bug Fixes

* add missing effect and callback dependencies in useChannelSearch hooks ([#2029](https://github.com/GetStream/stream-chat-react/issues/2029)) ([1090dd3](https://github.com/GetStream/stream-chat-react/commit/1090dd347c81a6bf7328db0be2da4cb9462c8d44))

## [10.8.2](https://github.com/GetStream/stream-chat-react/compare/v10.8.1...v10.8.2) (2023-06-09)


### Bug Fixes

* extend i18n datetime locale config type ([#2023](https://github.com/GetStream/stream-chat-react/issues/2023)) ([1db9163](https://github.com/GetStream/stream-chat-react/commit/1db9163df6eb41832ac58f835ccde1a6a1f70537))

## [10.8.1](https://github.com/GetStream/stream-chat-react/compare/v10.8.0...v10.8.1) (2023-05-22)


### Bug Fixes

* do not try close message input's autocomplete dropdown on textarea blur ([#2015](https://github.com/GetStream/stream-chat-react/issues/2015)) ([af4fb74](https://github.com/GetStream/stream-chat-react/commit/af4fb74dd7c1e7724e13cb88e41038434f680232))

# [10.8.0](https://github.com/GetStream/stream-chat-react/compare/v10.7.6...v10.8.0) (2023-05-05)


### Bug Fixes

* prevent duplicate simultaneous query channel quests ([#2004](https://github.com/GetStream/stream-chat-react/issues/2004)) ([33411b8](https://github.com/GetStream/stream-chat-react/commit/33411b8beae165475591ad6a03e22dc1be04eff7))
* prevent overriding event handlers in MessageInput's Textarea component ([#2006](https://github.com/GetStream/stream-chat-react/issues/2006)) ([569c53d](https://github.com/GetStream/stream-chat-react/commit/569c53db9725cafa1058f3068712e13d38bc773c))


### Features

* allow to retrieve the default message input value dynamically ([#2007](https://github.com/GetStream/stream-chat-react/issues/2007)) ([9316bdf](https://github.com/GetStream/stream-chat-react/commit/9316bdfa59efefdd431b946f0c9b607531f1485c))

## [10.7.6](https://github.com/GetStream/stream-chat-react/compare/v10.7.5...v10.7.6) (2023-04-24)


### Bug Fixes

* **renderText:** handle forward slash in mentions ([#1997](https://github.com/GetStream/stream-chat-react/issues/1997)) ([eb04651](https://github.com/GetStream/stream-chat-react/commit/eb04651607bc2444b2a864813b1561bf0552585b))

## [10.7.5](https://github.com/GetStream/stream-chat-react/compare/v10.7.4...v10.7.5) (2023-04-14)


### Bug Fixes

* prevent overwriting sent message on slow network ([#1993](https://github.com/GetStream/stream-chat-react/issues/1993)) ([5f5893a](https://github.com/GetStream/stream-chat-react/commit/5f5893ad829f6f716406b26dc4efc24d6a52f437))

## [10.7.4](https://github.com/GetStream/stream-chat-react/compare/v10.7.3...v10.7.4) (2023-04-05)


### Bug Fixes

* update channel state on user.deleted event ([#1985](https://github.com/GetStream/stream-chat-react/issues/1985)) ([767d194](https://github.com/GetStream/stream-chat-react/commit/767d1949522e290d5f006e4ef7adcd9351dfc07b))

## [10.7.3](https://github.com/GetStream/stream-chat-react/compare/v10.7.2...v10.7.3) (2023-03-16)


### Bug Fixes

* do not increase count of prepended VirtualizedMessageList messages of status "sending" or "failed" ([#1972](https://github.com/GetStream/stream-chat-react/issues/1972)) ([f1bf6fa](https://github.com/GetStream/stream-chat-react/commit/f1bf6fa8b21523e968b8eb9bb30ce5beb6eca9da))

## [10.7.2](https://github.com/GetStream/stream-chat-react/compare/v10.7.1...v10.7.2) (2023-03-08)


### Bug Fixes

* update event handler upon channel config update ([#1969](https://github.com/GetStream/stream-chat-react/issues/1969)) ([bec1f14](https://github.com/GetStream/stream-chat-react/commit/bec1f146ba57047ccad3ca223fd73a65aeceb26c))

## [10.7.1](https://github.com/GetStream/stream-chat-react/compare/v10.7.0...v10.7.1) (2023-03-03)


### Bug Fixes

* audit and upgrade packages with vulnerabilities ([#1959](https://github.com/GetStream/stream-chat-react/issues/1959)) ([a31a0bb](https://github.com/GetStream/stream-chat-react/commit/a31a0bb204f1c916ae7d4c3774241d39b0493ac8))

# [10.7.0](https://github.com/GetStream/stream-chat-react/compare/v10.6.0...v10.7.0) (2023-02-24)


### Bug Fixes

* **Attachment:** sanitization of image sources ([#1953](https://github.com/GetStream/stream-chat-react/issues/1953)) ([1c5e640](https://github.com/GetStream/stream-chat-react/commit/1c5e640f23f9522225e15ca3553dac8dc9168206))
* **MessageSystem:** duplicate element keys ([#1950](https://github.com/GetStream/stream-chat-react/issues/1950)) ([2f1df15](https://github.com/GetStream/stream-chat-react/commit/2f1df158d149a0991cc6d3b6dcc39a35263a6f16))


### Features

* **Attachments:** introduce UnsupportedAttachment component ([#1952](https://github.com/GetStream/stream-chat-react/issues/1952)) ([330b622](https://github.com/GetStream/stream-chat-react/commit/330b622ad7cd53f359ee7908990299332e3104ab))

# [10.6.0](https://github.com/GetStream/stream-chat-react/compare/v10.5.0...v10.6.0) (2023-02-10)


### Bug Fixes

* make all ThreadProps.additionalParentMessageProps keys optional ([#1920](https://github.com/GetStream/stream-chat-react/issues/1920)) ([62de38f](https://github.com/GetStream/stream-chat-react/commit/62de38f0947a28b16adec435dc9d823bbdec7743))
* make event optional for openThread in ChannelActionContext ([#1928](https://github.com/GetStream/stream-chat-react/issues/1928)) ([f144e9a](https://github.com/GetStream/stream-chat-react/commit/f144e9a130dad90093bf6425087e833503b5ead6))
* reflect thread prop in Window component ([#1919](https://github.com/GetStream/stream-chat-react/issues/1919)) ([689514c](https://github.com/GetStream/stream-chat-react/commit/689514c2f9bcf36a2af8d9950518c0f3d4441d28))


### Features

* add custom class to ConnectionStatus component ([#1924](https://github.com/GetStream/stream-chat-react/issues/1924)) ([d008b96](https://github.com/GetStream/stream-chat-react/commit/d008b96e8c95a4c3537c98141ee3302a5c2a0c8f))

# [10.5.0](https://github.com/GetStream/stream-chat-react/compare/v10.4.3...v10.5.0) (2023-01-13)


### Bug Fixes

* **renderText:** specify linkifyjs types to look for (`email` and `url`) ([#1902](https://github.com/GetStream/stream-chat-react/issues/1902)) ([b5e100e](https://github.com/GetStream/stream-chat-react/commit/b5e100ef0c2b6b3dd280f7a2943576c23148988f))


### Features

* **MessageInput:** extend mentionQueryParams to accept `filters` function  ([#1900](https://github.com/GetStream/stream-chat-react/issues/1900)) ([9c979f9](https://github.com/GetStream/stream-chat-react/commit/9c979f9e81c7be8b1aafce837a37f2f70d1907d9))

## [10.4.3](https://github.com/GetStream/stream-chat-react/compare/v10.4.2...v10.4.3) (2023-01-05)


### Bug Fixes

* check for window with getComputedStyle ([#1888](https://github.com/GetStream/stream-chat-react/issues/1888)) ([bb7f38d](https://github.com/GetStream/stream-chat-react/commit/bb7f38d293e29325b2486f4e8dd766db6b67ad9d))
* prevent duplicate pagination requests in InfiniteScroll ([#1885](https://github.com/GetStream/stream-chat-react/issues/1885)) ([cf5ec80](https://github.com/GetStream/stream-chat-react/commit/cf5ec804c0effbfc0f56308ef4effa837b6a82b3))

## [10.4.2](https://github.com/GetStream/stream-chat-react/compare/v10.4.1...v10.4.2) (2022-12-16)


### Bug Fixes

* merge mentionQueryParams.sort configuration correctly ([#1869](https://github.com/GetStream/stream-chat-react/issues/1869)) ([6ec31af](https://github.com/GetStream/stream-chat-react/commit/6ec31af24e7a45e70c8f47f0e6ce9d475d1d004a))
* **renderText:** special case @ symbol at the end of the message ([#1873](https://github.com/GetStream/stream-chat-react/issues/1873)) ([7dced57](https://github.com/GetStream/stream-chat-react/commit/7dced5729bed273282359886af078128c50ff35e))
* **useCooldownTimer:** derive cooldown from last message ([#1879](https://github.com/GetStream/stream-chat-react/issues/1879)) ([8e63653](https://github.com/GetStream/stream-chat-react/commit/8e6365320b10b3f52b8ccbe9a55c330de9c672b9))

## [10.4.1](https://github.com/GetStream/stream-chat-react/compare/v10.4.0...v10.4.1) (2022-11-18)


### Bug Fixes

* add linkify.test check before any URL instantiation ([#1838](https://github.com/GetStream/stream-chat-react/issues/1838)) ([ef1dd0a](https://github.com/GetStream/stream-chat-react/commit/ef1dd0ae5df511d0796c04808a08ee3ebfc00bc6))

# [10.4.0](https://github.com/GetStream/stream-chat-react/compare/v10.3.1...v10.4.0) (2022-11-04)


### Bug Fixes

* remove props spreading on React.Fragment (dragAndDropWindow) ([#1835](https://github.com/GetStream/stream-chat-react/issues/1835)) ([40c799a](https://github.com/GetStream/stream-chat-react/commit/40c799a9ed863dba9da1207b32966fe16b00349b))
* MessageSimple to apply renderText function from properties (#1824) ([7133b33](https://github.com/GetStream/stream-chat-react/pull/1824/commits/7133b331a336a1fd258038fe0de8b1bf7edc8ff6))


### Features

* export QuotedMessage component ([#1823](https://github.com/GetStream/stream-chat-react/issues/1823)) ([1850d30](https://github.com/GetStream/stream-chat-react/commit/1850d30306789b7cf220da373d5bea50697c5f3f))
* added remark-gfm plugin (#1824) ([69a64c2](https://github.com/GetStream/stream-chat-react/pull/1824/commits/69a64c2fbc6935d69adb644167d50decf95faf11))


### Performance Updates

* upgrade react-markdown, update renderText function, adjust types (#1824) ([6afe663](https://github.com/GetStream/stream-chat-react/pull/1824/commits/6afe663e3c2d59de2c7d364fd5d89d0d65521e87))

## [10.3.1](https://github.com/GetStream/stream-chat-react/compare/v10.3.0...v10.3.1) (2022-10-13)


### Bug Fixes

* add stream-chat@8.x.x to peerDependencies ([#1814](https://github.com/GetStream/stream-chat-react/issues/1814)) ([04bff7d](https://github.com/GetStream/stream-chat-react/commit/04bff7d28ae31ba2d4ba33937f132c92ca777671))

# [10.3.0](https://github.com/GetStream/stream-chat-react/compare/v10.2.0...v10.3.0) (2022-10-11)


### Bug Fixes

* replace use of channel config with channelCapabilities to derive permission flags ([#1807](https://github.com/GetStream/stream-chat-react/issues/1807)) ([1143117](https://github.com/GetStream/stream-chat-react/commit/11431176f042dbf3438162770127b085183c613f))
* unify paginator interface ([#1803](https://github.com/GetStream/stream-chat-react/issues/1803)) ([d65b7b9](https://github.com/GetStream/stream-chat-react/commit/d65b7b9c27bf41313390c18e4ddb155e080c463c)), closes [#1801](https://github.com/GetStream/stream-chat-react/issues/1801)


### Features

* add popper tooltip to SimpleReactionList items ([#1801](https://github.com/GetStream/stream-chat-react/issues/1801)) ([478f0f2](https://github.com/GetStream/stream-chat-react/commit/478f0f209a1e17db6ee1f61a945b22f763d02fb3))

# [10.2.0](https://github.com/GetStream/stream-chat-react/compare/v10.1.2...v10.2.0) (2022-10-04)


### Bug Fixes

* add image attachment height from CSS ([f5a9729](https://github.com/GetStream/stream-chat-react/commit/f5a9729292e6d42042e02f5b3ca46efa98e5615e))
* display messages in virtualized thread (theme v2) ([#1799](https://github.com/GetStream/stream-chat-react/issues/1799)) ([9c1a16f](https://github.com/GetStream/stream-chat-react/commit/9c1a16f196bafb7da858edf48370e5240e635108))
* example app build error ([5430213](https://github.com/GetStream/stream-chat-react/commit/54302138791ea4d98c7d480be39fb778a207230e))
* keep configuration parameter shouldGenerateVideoThumbnail in hook dep array ([50edd8b](https://github.com/GetStream/stream-chat-react/commit/50edd8b9abc562f51cf341397007a6d1ebf2f753))
* refresh virtualizedmessagelist after sizing has been set ([afea3d7](https://github.com/GetStream/stream-chat-react/commit/afea3d712b1d90684c780c37996ecbc5d2211407))
* replace Infinity in calc statements as browser support isn't great ([ebf89da](https://github.com/GetStream/stream-chat-react/commit/ebf89da53924461a5ac24acf603b65837ae5924d))
* update attachment configuration if attachment changed ([a6295dd](https://github.com/GetStream/stream-chat-react/commit/a6295dd47eaabfa62275f17b9c7985aa4e0f8d56))
* use useLayoutEffect for image and video height setting ([386fae7](https://github.com/GetStream/stream-chat-react/commit/386fae707e20c97db00f480776df83d2326aaa1a))


### Features

* check that attachment height style is available before using max-height ([79f6f1a](https://github.com/GetStream/stream-chat-react/commit/79f6f1a0e010215b9f0ea2072641c12f7222892a))
* integrate new CDN capabilities ([1520a34](https://github.com/GetStream/stream-chat-react/commit/1520a34f27f6a3a3cf81e4ec3a7074f52f86053e))
* update stream-chat-css version ([03166a9](https://github.com/GetStream/stream-chat-react/commit/03166a969960b81fe3d61b1a9e8d126df4e8a1dd))
* use video thumbnails returned by backend ([f68c8b1](https://github.com/GetStream/stream-chat-react/commit/f68c8b195c66708b8fc28686477bbfb61b7556ec))

## [10.1.2](https://github.com/GetStream/stream-chat-react/compare/v10.1.1...v10.1.2) (2022-09-30)


### Bug Fixes

* export all necessary components ([#1785](https://github.com/GetStream/stream-chat-react/issues/1785)) ([075f703](https://github.com/GetStream/stream-chat-react/commit/075f70389feb62f8638dbed0d1fd244f86829eb1))
* update pinnedMessages context property on pin/unpin message ([#1784](https://github.com/GetStream/stream-chat-react/issues/1784)) ([15128ab](https://github.com/GetStream/stream-chat-react/commit/15128ab5f74e4f068bf6443c34eec8baf18f8453))

## [10.1.1](https://github.com/GetStream/stream-chat-react/compare/v10.1.0...v10.1.1) (2022-09-20)


### Bug Fixes

* edge case of prepend count not being reset when jumping ([#1765](https://github.com/GetStream/stream-chat-react/issues/1765)) ([18ba8f8](https://github.com/GetStream/stream-chat-react/commit/18ba8f83261ec8157651721404906e0f00c92fd4))

# [10.1.0](https://github.com/GetStream/stream-chat-react/compare/v10.0.2...v10.1.0) (2022-09-19)


### Bug Fixes

* **VirtualizedMessageList:** use memoized values as hook dependencies directly ([#1761](https://github.com/GetStream/stream-chat-react/issues/1761)) ([41d1d67](https://github.com/GetStream/stream-chat-react/commit/41d1d67e00dbbf7bd94a8bfa384df400aa0d62c4))


### Features

* provide close callback to app menu ([#1754](https://github.com/GetStream/stream-chat-react/issues/1754)) ([5202a5f](https://github.com/GetStream/stream-chat-react/commit/5202a5f5512ad72cd0dbcb974092d15bb675f826))

## [10.0.2](https://github.com/GetStream/stream-chat-react/compare/v10.0.1...v10.0.2) (2022-09-14)


### Bug Fixes

* **ChannelList:** update class names order for theming variables ([#1747](https://github.com/GetStream/stream-chat-react/issues/1747)) ([80ec36e](https://github.com/GetStream/stream-chat-react/commit/80ec36e44e2f383c7eea46ce70aaf719e4d5c43a))
* play video in attachment card theme v1 ([#1748](https://github.com/GetStream/stream-chat-react/issues/1748)) ([cd31d19](https://github.com/GetStream/stream-chat-react/commit/cd31d19ec90b784942821301a4164c0bac40a7f2))
* **Textarea:** prevent caret movement on suggestion list item select ([#1732](https://github.com/GetStream/stream-chat-react/issues/1732)) ([be44762](https://github.com/GetStream/stream-chat-react/commit/be447621cfb118dcefa6d27a6d6ff2b26977e177))

## [10.0.1](https://github.com/GetStream/stream-chat-react/compare/v10.0.0...v10.0.1) (2022-09-12)


### Bug Fixes

* remove useId from LoadingIndicatorIcon ([#1744](https://github.com/GetStream/stream-chat-react/issues/1744)) ([14bfeb6](https://github.com/GetStream/stream-chat-react/commit/14bfeb6c5f5c90f8fea1cb1f3e1bb67dce11ecf6))

# [10.0.0](https://github.com/GetStream/stream-chat-react/compare/v9.5.1...v10.0.0) (2022-09-09)


### Bug Fixes

* add missing class str-chat__message-actions-list-item-button to CustomMessageActions root ([be16e40](https://github.com/GetStream/stream-chat-react/commit/be16e40613f8135ffac7b4b3b0e54dde34952f45))
* add missing getChannels callback dependency "searching" ([a3307f7](https://github.com/GetStream/stream-chat-react/commit/a3307f73a2e133586b64f9adce3c3fa7e721cba9))
* add str-chat__message--other class to MessageDeleted ([25f3190](https://github.com/GetStream/stream-chat-react/commit/25f3190cab15e190f13bcd67ad6b4776f5e5addc))
* **Card:** prefer title_link over og_scrape_url ([843990e](https://github.com/GetStream/stream-chat-react/commit/843990e034a1dcccac0ed17a5f3c86ff73200301))
* do not generate class names to contain string 'undefined', do not pass Media prop to Card ([40342fe](https://github.com/GetStream/stream-chat-react/commit/40342fe5ef4e78a228e653cda25a6cb08600ba7b))
* **EditMessageForm:** remove circular dependency ([6218a65](https://github.com/GetStream/stream-chat-react/commit/6218a651cbcd5df0a8f10dbf7874ee1abe1c2278))
* exit with non-zero status code if failed to provide args to merge-stream-chat-css-docs.sh ([a4719b9](https://github.com/GetStream/stream-chat-react/commit/a4719b9168ac3e34de88b2aa112eda338017f096))
* File attachment UI in theme-v1 ([0a80bef](https://github.com/GetStream/stream-chat-react/commit/0a80bef1948559ed10f1f7d2fa0bc542a727a4d9))
* File attachment UI in theme-v1 ([9604ca6](https://github.com/GetStream/stream-chat-react/commit/9604ca6f79fcd74d87c019352c8e5a155b00ab59))
* **FilePreviewItem:** add file type for correct file icons ([6e6fce5](https://github.com/GetStream/stream-chat-react/commit/6e6fce5cba110bcf92cc365219d038355879ce37))
* forward SearchInput prop to SearchBar ([16fc8f8](https://github.com/GetStream/stream-chat-react/commit/16fc8f8278cff7b2fe60dadf026307bdb2d0aeb7))
* improve scrollToBottom with image attachments ([be8bb7a](https://github.com/GetStream/stream-chat-react/commit/be8bb7ae4a986cb6556674c1bec896c5539bb822))
* **MessageInput:** add container className ([a5e7908](https://github.com/GetStream/stream-chat-react/commit/a5e7908e0e7d9e86cfa0d82b52b274ee75ac3d65))
* **MessageInputFlat:** send button adjustments ([f456704](https://github.com/GetStream/stream-chat-react/commit/f456704a1b48a87612cc94b5bf0015a382e16783))
* **MessageInput:** remove useId, add quotedMessage patch ([64e07d3](https://github.com/GetStream/stream-chat-react/commit/64e07d36a8589c2ceb5344b7c23b808808580a39))
* **MessageInput:** update dropzone markup ([974802b](https://github.com/GetStream/stream-chat-react/commit/974802bebee8d0128772031e719868d9bfb4f797))
* **MessageList:** prevent redundant calls to scroll to bottom, don't use ResizeObserver ([363676e](https://github.com/GetStream/stream-chat-react/commit/363676ea91a31da1991504233add53e05f500581))
* **MessageStatus:** add V2 TooltipContainer component "shim" ([dcfbbfb](https://github.com/GetStream/stream-chat-react/commit/dcfbbfbc0d626df23f7e7cf8b53fab059fedbecd))
* move card caption to card content and rename to source link ([c44bcd7](https://github.com/GetStream/stream-chat-react/commit/c44bcd771ce5fd677bf27fd3949c1d503941495f))
* **QuotedMessagePreview:** use themingVersion instead of PreviewHeader property ([4f79b07](https://github.com/GetStream/stream-chat-react/commit/4f79b07d840c332ca14fc38fc5dd1dee43a4f1dd))
* reduce mount/unmount of image attachments ([34082a4](https://github.com/GetStream/stream-chat-react/commit/34082a4600281a77c8792a1aad8a3c75b7bcd3c5))
* Responsive layout ([7551650](https://github.com/GetStream/stream-chat-react/commit/7551650b3541d8dbd221659b0059cfd1e79c73c8))
* show channel list if search input contains empty string ([b73dd2c](https://github.com/GetStream/stream-chat-react/commit/b73dd2cbec71ff7b423317b0a489d1c6ac03135e))
* **SuggestionList:** update trigger limits ([2e1f025](https://github.com/GetStream/stream-chat-react/commit/2e1f025e2261be1f1c22239a6f2d06584b767351))
* sync event listener keyDown type btw the image attachment and gallery modal ([51e7c14](https://github.com/GetStream/stream-chat-react/commit/51e7c14183c08b07792f7afb15606ab9affe9c34))
* ThemingV2 beta adjustments ([#1728](https://github.com/GetStream/stream-chat-react/issues/1728)) ([785ee11](https://github.com/GetStream/stream-chat-react/commit/785ee11f736ff1e8698e47c5f1ca3e2b8a222bae))
* **ThemingV2:** MessageInputFlat missing lodash/zipObject ([#1721](https://github.com/GetStream/stream-chat-react/issues/1721)) ([dd8a457](https://github.com/GetStream/stream-chat-react/commit/dd8a4576483d114d1c8f0f6c9bb383896d926a97))
* **TypingIndicator:** adjust position of the indicator ([f5db199](https://github.com/GetStream/stream-chat-react/commit/f5db199593806e2f5ec46c742765d41f6c128547))
* **TypingIndicator:** use MessageListMainPanel to position the indicator ([865cbc8](https://github.com/GetStream/stream-chat-react/commit/865cbc8f2e0e600307e912b8d888441de3f9a1ac))


* Merge pull request #1697 from GetStream/theming-v2-user-testing ([2c133ad](https://github.com/GetStream/stream-chat-react/commit/2c133ad2a511773c0381d1edd9dbd7fe892e485e)), closes [#1697](https://github.com/GetStream/stream-chat-react/issues/1697)
* Remove useMobilePress and useBreakpoint hooks (#1648) ([430bf24](https://github.com/GetStream/stream-chat-react/commit/430bf24db033c7a9010f259dc5fc326b1c768206)), closes [#1648](https://github.com/GetStream/stream-chat-react/issues/1648)


### Features

* adapt MessageOptions to theming v2 ([23c2d93](https://github.com/GetStream/stream-chat-react/commit/23c2d93cc2452f5711625a5a198d01d1a2d9d7c0))
* adapt MessageStatus to theming v2 ([a5b0fae](https://github.com/GetStream/stream-chat-react/commit/a5b0fae589ae72eff24436ec06d49d16aad22106))
* add "str-chat__message--error-message" class to message error div ([c4f7520](https://github.com/GetStream/stream-chat-react/commit/c4f7520aa0a113547a1f44834dcf9636df42fc00))
* add Attachment icons for theming v2 ([97e8047](https://github.com/GetStream/stream-chat-react/commit/97e8047651b788d5eb588da99c9e7e0c67657873))
* add Card component for theming v2 ([5f5341f](https://github.com/GetStream/stream-chat-react/commit/5f5341ff112658c75675cbf2a77b76aa80f330a3))
* add class "str-chat__message-sender-avatar" to Avatar root to display it for sender only ([ecd0b4b](https://github.com/GetStream/stream-chat-react/commit/ecd0b4b255023d3f665dfebb651ea69e5b5885a2))
* add class str-chat__message-list-scroll to virtuoso root element ([7d2284e](https://github.com/GetStream/stream-chat-react/commit/7d2284ea0dbc9342d1b98247980b23b83aa80472))
* add common IconProps type ([3ff89bb](https://github.com/GetStream/stream-chat-react/commit/3ff89bb75a7204e0805e88ee61988a172932a394))
* add FileAttachment component for theming v2 ([52acd80](https://github.com/GetStream/stream-chat-react/commit/52acd80b6b7ccd939aae357b0019f1b99975f585))
* add group styles to virtualized message list items ([ff2044e](https://github.com/GetStream/stream-chat-react/commit/ff2044e7414bb57644767d3288d96cb76594646d))
* add Message icons for theming v2 - MessageDeliveredIcon, MessageErrorIcon ([9ff9034](https://github.com/GetStream/stream-chat-react/commit/9ff9034aa036a382326bb737fc68cc28664ed856))
* add ModalGallery to the ComponentContext ([27e149a](https://github.com/GetStream/stream-chat-react/commit/27e149a64ad0cbf05342e8a0132fb03c153da7eb))
* add realistic giphy attachment generator ([e4c2a7b](https://github.com/GetStream/stream-chat-react/commit/e4c2a7bde291a9fdad51b336abadd233998558ec))
* add str-chat__simple-message--error-failed class to str-chat__message-inner ([a5f8f94](https://github.com/GetStream/stream-chat-react/commit/a5f8f94a50239fbe8b3bc24c6cdb5c889d613193))
* add str-chat-react__modal__inner class to str-chat__modal__inner ([0234522](https://github.com/GetStream/stream-chat-react/commit/0234522547d7d68754ae4cc7ba1e1bcfab509626))
* add svg image class to attachment ([3d0237d](https://github.com/GetStream/stream-chat-react/commit/3d0237d3dad20b4aeb605c8bf78c7165f7469fd8))
* add theme v2 class to CustomNotification ([037dc89](https://github.com/GetStream/stream-chat-react/commit/037dc89e7dd5035f162da610f02fbb575bd8efcb))
* add theme v2 to Reaction components, extract shared logic ReactionList & SimpleReactionList ([f6a12d0](https://github.com/GetStream/stream-chat-react/commit/f6a12d0ca7b2fa939ba2a3f4319d2e02ff4daabe))
* add themeVersion flag to ChatProps & ChatContext ([70cbfcb](https://github.com/GetStream/stream-chat-react/commit/70cbfcbce643b230d8f7c66f615b4cc9bde9b816))
* add ThemeVersion type to ChatContext ([695f30a](https://github.com/GetStream/stream-chat-react/commit/695f30a0f6137c4c84f07ef8528e97f6666a40db))
* add theming v2 changes for channel and channel header ([#1632](https://github.com/GetStream/stream-chat-react/issues/1632)) ([3f8fddb](https://github.com/GetStream/stream-chat-react/commit/3f8fddba0ad361fe00c39191324ec18de902ace5))
* add theming v2 classes to MessageActions elements ([d62e04a](https://github.com/GetStream/stream-chat-react/commit/d62e04a8791338c5a4eef4b44a5a1e210bd6e2d7))
* add theming v2 classes to QuotedMessage ([8c5d2ff](https://github.com/GetStream/stream-chat-react/commit/8c5d2ffd2517375dcad67a740207f0d76d720d4b))
* add theming v2 classes to ReactionSelector & ReactionList ([fbedb42](https://github.com/GetStream/stream-chat-react/commit/fbedb42cf565922ac59b64779d70c64ecc074511))
* add v2 classes to send and cancel button of EditMessageForm ([#1669](https://github.com/GetStream/stream-chat-react/issues/1669)) ([ab75c2c](https://github.com/GetStream/stream-chat-react/commit/ab75c2c8b51a54384d327fc97c0db3151ffaa10c))
* adjust Audio widget for theming v2 ([f08c6f5](https://github.com/GetStream/stream-chat-react/commit/f08c6f5f3d06d856f2e0946a6fda8475c9c637c8))
* adjust Gallery and Image widget for theming v2 ([de29a73](https://github.com/GetStream/stream-chat-react/commit/de29a7337d7472ac2a8541632a03f829beecee0c))
* adjust MessageRepliesCountButton to theming v2, add classes ([5076fd5](https://github.com/GetStream/stream-chat-react/commit/5076fd5163e3394a0881b5fe7c1ac0f1252038fc))
* adjust MessageSimple for theming v2 ([ebd4bd7](https://github.com/GetStream/stream-chat-react/commit/ebd4bd7758ae0afaf3547e281377f46b3b5dc6ab))
* allow card image enlargement in modal ([47bf301](https://github.com/GetStream/stream-chat-react/commit/47bf301d75c4ad71bcbbc8f19f2dd28ecd136364))
* apply theme-v2 to channel list and preview  ([#1603](https://github.com/GetStream/stream-chat-react/issues/1603)) ([cc88f1f](https://github.com/GetStream/stream-chat-react/commit/cc88f1fe5937fd837b70281d642db2c8af6e4159))
* change the close icon for modal and remove Close text ([88a5f7c](https://github.com/GetStream/stream-chat-react/commit/88a5f7c6659e520b629bf735e3dba395c452ac5e))
* compute the themeVersion value, remove themeVersion Chat prop ([3421087](https://github.com/GetStream/stream-chat-react/commit/34210879aaede5ecf63dc4c85da47440372af058))
* convert attachment render functions into components, group attachments in order ([aeee078](https://github.com/GetStream/stream-chat-react/commit/aeee07884310043d08594a767b4a9c735bf2cfc6))
* do not sanitize attachment scrape urls ([aa1624a](https://github.com/GetStream/stream-chat-react/commit/aa1624a619a89351217ad8e5512b4471512db4ba))
* extract CardAudio and render only uploaded audio data in Audio component ([8027908](https://github.com/GetStream/stream-chat-react/commit/80279083cbd336cf3a8de2a5ce4658e1926aa838))
* forward flag "disabled" to search input ([2ec25a1](https://github.com/GetStream/stream-chat-react/commit/2ec25a110a0f0c5c16af5a1e7d7bbe0633b095d3))
* include the parent message in virtualized scrollable message list ([dd63427](https://github.com/GetStream/stream-chat-react/commit/dd63427376460ca964b8560fc6086adbe8049fa2))
* message is considered top if it has reactions and bottom if the next message has reactions ([638aead](https://github.com/GetStream/stream-chat-react/commit/638aead0c3dd8202653d25351402f73c84f23909))
* **MessageInput:** add drag & drop upload functionality ([e731b67](https://github.com/GetStream/stream-chat-react/commit/e731b676af8a9b9bfc81e87a0a3b5af506ab4ea0))
* **ProgressBar:** add "seeking" feature to the progress bar ([0320864](https://github.com/GetStream/stream-chat-react/commit/032086456bb76a36f51fa701faf5f5fb60671548))
* **ProgressBar:** add onClick property ([4d9d06c](https://github.com/GetStream/stream-chat-react/commit/4d9d06c9fa3aa2426fb61d78dc331856db6a02da))
* remove avatar from the thread header ([dec0d8d](https://github.com/GetStream/stream-chat-react/commit/dec0d8ddaff5d87d130aa08e90f68b9270da145a))
* remove deprecated components: MessageCommerce, MessageLivestream, MessageTeam ([9d75fb8](https://github.com/GetStream/stream-chat-react/commit/9d75fb892e20cbdfd705cc94210c2ae12a5f9650))
* remove translations for deprecated components: MessageCommerce, MessageLivestream, MessageTeam ([e524d0a](https://github.com/GetStream/stream-chat-react/commit/e524d0a986c0f417d3a0c1106d1134856b32d5eb))
* render cards for each attachment with scraped data ([0a59806](https://github.com/GetStream/stream-chat-react/commit/0a598067bf1dad6a8bb4451ba2338ec3ec0d5d9c))
* show always ScrollToBottomButton on scroll up and show unread message count ([e554356](https://github.com/GetStream/stream-chat-react/commit/e5543560c8ae52c38980892cdc4bd86c201a9b58))
* stop using FixedHeightMessage as default VirtualMessage component ([fc67915](https://github.com/GetStream/stream-chat-react/commit/fc67915f36c31c4302b325250376d8de8cb26eb2))
* switch ladle to v2 ([ecd1cc6](https://github.com/GetStream/stream-chat-react/commit/ecd1cc6e2774ace8daed2e364a44db1d7ba48179))
* **theming-v2:** add channel search for theme v2 ([#1685](https://github.com/GetStream/stream-chat-react/issues/1685)) ([b735c30](https://github.com/GetStream/stream-chat-react/commit/b735c30817e0113aec58761aa166351fae5691b9)), closes [#1669](https://github.com/GetStream/stream-chat-react/issues/1669)
* **ThemingV2:** PopperTooltip component ([#1714](https://github.com/GetStream/stream-chat-react/issues/1714)) ([9b6301e](https://github.com/GetStream/stream-chat-react/commit/9b6301e9f7089560ba4cfe694583bd93c1aa10de))
* **TypingIndicator:** add translations ([f079e26](https://github.com/GetStream/stream-chat-react/commit/f079e26a48942b1a945e2e00e09ae1f2810ae427))
* update @stream-io/stream-chat-css to v3.0.0 ([c5e392c](https://github.com/GetStream/stream-chat-react/commit/c5e392c9f7daee2ad9467d79a32123f0b8e9c9ce))
* update message componets with theme v2 designs ([e5192d5](https://github.com/GetStream/stream-chat-react/commit/e5192d59b29625a3b961b4a130f1368de0f8a5d7))
* use FileIcon with version in UploadsPreview ([4d150b1](https://github.com/GetStream/stream-chat-react/commit/4d150b108ef8bc406800ad7bd7edc1c4f8afcc66))
* wrap ThreadHead content in a div to enable styling for class str-chat__parent-message-li ([9323edb](https://github.com/GetStream/stream-chat-react/commit/9323edb46aa0bf0c83d23817698756d9cbdf2da4))


### Reverts

* fix: File attachment UI in theme-v1 ([789dd27](https://github.com/GetStream/stream-chat-react/commit/789dd273b016be42f72baeeb0423f79f380e05eb))


### BREAKING CHANGES

* ThemingV2 - user testing and adjustments
* useMobilePress and useBreakpoint hooks are removed.

useMobilePress:
Historically, this hook programmatically handled the user interaction with Message components
by toggling `mobile-press` class upon user interaction.
The goal of this operation was to have the message actions displayed on the screen.
Internally, we found a better solution by offloading this behavior to the browser and
utilizing `:focus` and `:focus-within` CSS pseudo-selectors.

useBreakpoint:
This hook did hold the "programmatic" responsive UI breakpoints.
We realized they aren't always in line with our stylesheet breakpoints and possibly with our
customer's breakpoints. This misalignment was causing some inconsistencies and issues.
We are removing this hook because we believe defining UI breakpoints should be
responsibility of our customers.

SearchResults:
During the refactoring, we stumbled upon one side-effect where `popupResults` prop
wasn't always respected. The fix of it could be a breaking change for a small percentage
of our customers, but we believe this fix is the right thing to do.

# [10.0.0-theming-v2.3](https://github.com/GetStream/stream-chat-react/compare/v10.0.0-theming-v2.2...v10.0.0-theming-v2.3) (2022-09-06)


### Bug Fixes

* include mdast-util-find-and-replace into our CJS bundle ([#1702](https://github.com/GetStream/stream-chat-react/issues/1702)) ([#1703](https://github.com/GetStream/stream-chat-react/issues/1703)) ([8010889](https://github.com/GetStream/stream-chat-react/commit/801088972032dcfd0374b00aa424a5952b7e72ae)), closes [#1698](https://github.com/GetStream/stream-chat-react/issues/1698)
* prevent double submissions in korean ([#1720](https://github.com/GetStream/stream-chat-react/issues/1720)) ([5d781d8](https://github.com/GetStream/stream-chat-react/commit/5d781d896cb9153bcf3554d04714215c0bbf5c12))
* ThemingV2 beta adjustments ([#1728](https://github.com/GetStream/stream-chat-react/issues/1728)) ([785ee11](https://github.com/GetStream/stream-chat-react/commit/785ee11f736ff1e8698e47c5f1ca3e2b8a222bae))
* **ThemingV2:** MessageInputFlat missing lodash/zipObject ([#1721](https://github.com/GetStream/stream-chat-react/issues/1721)) ([dd8a457](https://github.com/GetStream/stream-chat-react/commit/dd8a4576483d114d1c8f0f6c9bb383896d926a97))
* **Vite:** add emoji-mart (emoji, picker) re-export ([#1724](https://github.com/GetStream/stream-chat-react/issues/1724)) ([c90cf4b](https://github.com/GetStream/stream-chat-react/commit/c90cf4bfc6b6aa74233fd041200e8180a70604e4))


### Features

* increase and support overriding jump to message limit ([#1718](https://github.com/GetStream/stream-chat-react/issues/1718)) ([8c720f4](https://github.com/GetStream/stream-chat-react/commit/8c720f41e349f753a126ad5e062c1475e3893771))
* **ThemingV2:** PopperTooltip component ([#1714](https://github.com/GetStream/stream-chat-react/issues/1714)) ([9b6301e](https://github.com/GetStream/stream-chat-react/commit/9b6301e9f7089560ba4cfe694583bd93c1aa10de))

# [10.0.0-theming-v2.2](https://github.com/GetStream/stream-chat-react/compare/v10.0.0-theming-v2.1...v10.0.0-theming-v2.2) (2022-08-22)


### Features

* add svg image class to attachment ([3d0237d](https://github.com/GetStream/stream-chat-react/commit/3d0237d3dad20b4aeb605c8bf78c7165f7469fd8))

# [10.0.0-theming-v2.1](https://github.com/GetStream/stream-chat-react/compare/v9.4.0...v10.0.0-theming-v2.1) (2022-08-18)


### Bug Fixes

* add str-chat__message--other class to MessageDeleted ([25f3190](https://github.com/GetStream/stream-chat-react/commit/25f3190cab15e190f13bcd67ad6b4776f5e5addc))
* **Card:** prefer title_link over og_scrape_url ([843990e](https://github.com/GetStream/stream-chat-react/commit/843990e034a1dcccac0ed17a5f3c86ff73200301))
* do not generate class names to contain string 'undefined', do not pass Media prop to Card ([40342fe](https://github.com/GetStream/stream-chat-react/commit/40342fe5ef4e78a228e653cda25a6cb08600ba7b))
* **EditMessageForm:** remove circular dependency ([6218a65](https://github.com/GetStream/stream-chat-react/commit/6218a651cbcd5df0a8f10dbf7874ee1abe1c2278))
* File attachment UI in theme-v1 ([0a80bef](https://github.com/GetStream/stream-chat-react/commit/0a80bef1948559ed10f1f7d2fa0bc542a727a4d9))
* File attachment UI in theme-v1 ([9604ca6](https://github.com/GetStream/stream-chat-react/commit/9604ca6f79fcd74d87c019352c8e5a155b00ab59))
* **FilePreviewItem:** add file type for correct file icons ([6e6fce5](https://github.com/GetStream/stream-chat-react/commit/6e6fce5cba110bcf92cc365219d038355879ce37))
* improve scrollToBottom with image attachments ([be8bb7a](https://github.com/GetStream/stream-chat-react/commit/be8bb7ae4a986cb6556674c1bec896c5539bb822))
* include mdast-util-find-and-replace into our CJS bundle ([#1702](https://github.com/GetStream/stream-chat-react/issues/1702)) ([61c4eec](https://github.com/GetStream/stream-chat-react/commit/61c4eecf5c03ab36109a94b7afa5f678e99fcc8b)), closes [#1698](https://github.com/GetStream/stream-chat-react/issues/1698)
* **MessageInput:** add container className ([a5e7908](https://github.com/GetStream/stream-chat-react/commit/a5e7908e0e7d9e86cfa0d82b52b274ee75ac3d65))
* **MessageInputFlat:** send button adjustments ([f456704](https://github.com/GetStream/stream-chat-react/commit/f456704a1b48a87612cc94b5bf0015a382e16783))
* **MessageInput:** remove useId, add quotedMessage patch ([64e07d3](https://github.com/GetStream/stream-chat-react/commit/64e07d36a8589c2ceb5344b7c23b808808580a39))
* **MessageInput:** update dropzone markup ([974802b](https://github.com/GetStream/stream-chat-react/commit/974802bebee8d0128772031e719868d9bfb4f797))
* **MessageList:** prevent redundant calls to scroll to bottom, don't use ResizeObserver ([363676e](https://github.com/GetStream/stream-chat-react/commit/363676ea91a31da1991504233add53e05f500581))
* **MessageStatus:** add V2 TooltipContainer component "shim" ([dcfbbfb](https://github.com/GetStream/stream-chat-react/commit/dcfbbfbc0d626df23f7e7cf8b53fab059fedbecd))
* move card caption to card content and rename to source link ([c44bcd7](https://github.com/GetStream/stream-chat-react/commit/c44bcd771ce5fd677bf27fd3949c1d503941495f))
* **QuotedMessagePreview:** use themingVersion instead of PreviewHeader property ([4f79b07](https://github.com/GetStream/stream-chat-react/commit/4f79b07d840c332ca14fc38fc5dd1dee43a4f1dd))
* reduce mount/unmount of image attachments ([34082a4](https://github.com/GetStream/stream-chat-react/commit/34082a4600281a77c8792a1aad8a3c75b7bcd3c5))
* replace FileReader with URL.createObjectURL ([#1701](https://github.com/GetStream/stream-chat-react/issues/1701)) ([c8a490e](https://github.com/GetStream/stream-chat-react/commit/c8a490ebc53da03c2b0f064de88c0cb634ed2a70))
* Responsive layout ([7551650](https://github.com/GetStream/stream-chat-react/commit/7551650b3541d8dbd221659b0059cfd1e79c73c8))
* **SuggestionList:** update trigger limits ([2e1f025](https://github.com/GetStream/stream-chat-react/commit/2e1f025e2261be1f1c22239a6f2d06584b767351))
* sync event listener keyDown type btw the image attachment and gallery modal ([51e7c14](https://github.com/GetStream/stream-chat-react/commit/51e7c14183c08b07792f7afb15606ab9affe9c34))
* **TypingIndicator:** adjust position of the indicator ([f5db199](https://github.com/GetStream/stream-chat-react/commit/f5db199593806e2f5ec46c742765d41f6c128547))
* **TypingIndicator:** use MessageListMainPanel to position the indicator ([865cbc8](https://github.com/GetStream/stream-chat-react/commit/865cbc8f2e0e600307e912b8d888441de3f9a1ac))


* Merge pull request #1697 from GetStream/theming-v2-user-testing ([2c133ad](https://github.com/GetStream/stream-chat-react/commit/2c133ad2a511773c0381d1edd9dbd7fe892e485e)), closes [#1697](https://github.com/GetStream/stream-chat-react/issues/1697)
* Remove useMobilePress and useBreakpoint hooks (#1648) ([430bf24](https://github.com/GetStream/stream-chat-react/commit/430bf24db033c7a9010f259dc5fc326b1c768206)), closes [#1648](https://github.com/GetStream/stream-chat-react/issues/1648)


### Features

* adapt MessageOptions to theming v2 ([23c2d93](https://github.com/GetStream/stream-chat-react/commit/23c2d93cc2452f5711625a5a198d01d1a2d9d7c0))
* adapt MessageStatus to theming v2 ([a5b0fae](https://github.com/GetStream/stream-chat-react/commit/a5b0fae589ae72eff24436ec06d49d16aad22106))
* add "str-chat__message--error-message" class to message error div ([c4f7520](https://github.com/GetStream/stream-chat-react/commit/c4f7520aa0a113547a1f44834dcf9636df42fc00))
* add Attachment icons for theming v2 ([97e8047](https://github.com/GetStream/stream-chat-react/commit/97e8047651b788d5eb588da99c9e7e0c67657873))
* add Card component for theming v2 ([5f5341f](https://github.com/GetStream/stream-chat-react/commit/5f5341ff112658c75675cbf2a77b76aa80f330a3))
* add class "str-chat__message-sender-avatar" to Avatar root to display it for sender only ([ecd0b4b](https://github.com/GetStream/stream-chat-react/commit/ecd0b4b255023d3f665dfebb651ea69e5b5885a2))
* add class str-chat__message-list-scroll to virtuoso root element ([7d2284e](https://github.com/GetStream/stream-chat-react/commit/7d2284ea0dbc9342d1b98247980b23b83aa80472))
* add common IconProps type ([3ff89bb](https://github.com/GetStream/stream-chat-react/commit/3ff89bb75a7204e0805e88ee61988a172932a394))
* add FileAttachment component for theming v2 ([52acd80](https://github.com/GetStream/stream-chat-react/commit/52acd80b6b7ccd939aae357b0019f1b99975f585))
* add group styles to virtualized message list items ([ff2044e](https://github.com/GetStream/stream-chat-react/commit/ff2044e7414bb57644767d3288d96cb76594646d))
* add Message icons for theming v2 - MessageDeliveredIcon, MessageErrorIcon ([9ff9034](https://github.com/GetStream/stream-chat-react/commit/9ff9034aa036a382326bb737fc68cc28664ed856))
* add ModalGallery to the ComponentContext ([27e149a](https://github.com/GetStream/stream-chat-react/commit/27e149a64ad0cbf05342e8a0132fb03c153da7eb))
* add realistic giphy attachment generator ([e4c2a7b](https://github.com/GetStream/stream-chat-react/commit/e4c2a7bde291a9fdad51b336abadd233998558ec))
* add str-chat__simple-message--error-failed class to str-chat__message-inner ([a5f8f94](https://github.com/GetStream/stream-chat-react/commit/a5f8f94a50239fbe8b3bc24c6cdb5c889d613193))
* add str-chat-react__modal__inner class to str-chat__modal__inner ([0234522](https://github.com/GetStream/stream-chat-react/commit/0234522547d7d68754ae4cc7ba1e1bcfab509626))
* add theme v2 class to CustomNotification ([037dc89](https://github.com/GetStream/stream-chat-react/commit/037dc89e7dd5035f162da610f02fbb575bd8efcb))
* add theme v2 to Reaction components, extract shared logic ReactionList & SimpleReactionList ([f6a12d0](https://github.com/GetStream/stream-chat-react/commit/f6a12d0ca7b2fa939ba2a3f4319d2e02ff4daabe))
* add themeVersion flag to ChatProps & ChatContext ([70cbfcb](https://github.com/GetStream/stream-chat-react/commit/70cbfcbce643b230d8f7c66f615b4cc9bde9b816))
* add ThemeVersion type to ChatContext ([695f30a](https://github.com/GetStream/stream-chat-react/commit/695f30a0f6137c4c84f07ef8528e97f6666a40db))
* add theming v2 changes for channel and channel header ([#1632](https://github.com/GetStream/stream-chat-react/issues/1632)) ([3f8fddb](https://github.com/GetStream/stream-chat-react/commit/3f8fddba0ad361fe00c39191324ec18de902ace5))
* add theming v2 classes to MessageActions elements ([d62e04a](https://github.com/GetStream/stream-chat-react/commit/d62e04a8791338c5a4eef4b44a5a1e210bd6e2d7))
* add theming v2 classes to QuotedMessage ([8c5d2ff](https://github.com/GetStream/stream-chat-react/commit/8c5d2ffd2517375dcad67a740207f0d76d720d4b))
* add theming v2 classes to ReactionSelector & ReactionList ([fbedb42](https://github.com/GetStream/stream-chat-react/commit/fbedb42cf565922ac59b64779d70c64ecc074511))
* add v2 classes to send and cancel button of EditMessageForm ([#1669](https://github.com/GetStream/stream-chat-react/issues/1669)) ([ab75c2c](https://github.com/GetStream/stream-chat-react/commit/ab75c2c8b51a54384d327fc97c0db3151ffaa10c))
* adjust Audio widget for theming v2 ([f08c6f5](https://github.com/GetStream/stream-chat-react/commit/f08c6f5f3d06d856f2e0946a6fda8475c9c637c8))
* adjust Gallery and Image widget for theming v2 ([de29a73](https://github.com/GetStream/stream-chat-react/commit/de29a7337d7472ac2a8541632a03f829beecee0c))
* adjust MessageRepliesCountButton to theming v2, add classes ([5076fd5](https://github.com/GetStream/stream-chat-react/commit/5076fd5163e3394a0881b5fe7c1ac0f1252038fc))
* adjust MessageSimple for theming v2 ([ebd4bd7](https://github.com/GetStream/stream-chat-react/commit/ebd4bd7758ae0afaf3547e281377f46b3b5dc6ab))
* allow card image enlargement in modal ([47bf301](https://github.com/GetStream/stream-chat-react/commit/47bf301d75c4ad71bcbbc8f19f2dd28ecd136364))
* apply theme-v2 to channel list and preview  ([#1603](https://github.com/GetStream/stream-chat-react/issues/1603)) ([cc88f1f](https://github.com/GetStream/stream-chat-react/commit/cc88f1fe5937fd837b70281d642db2c8af6e4159))
* change the close icon for modal and remove Close text ([88a5f7c](https://github.com/GetStream/stream-chat-react/commit/88a5f7c6659e520b629bf735e3dba395c452ac5e))
* compute the themeVersion value, remove themeVersion Chat prop ([3421087](https://github.com/GetStream/stream-chat-react/commit/34210879aaede5ecf63dc4c85da47440372af058))
* convert attachment render functions into components, group attachments in order ([aeee078](https://github.com/GetStream/stream-chat-react/commit/aeee07884310043d08594a767b4a9c735bf2cfc6))
* do not sanitize attachment scrape urls ([aa1624a](https://github.com/GetStream/stream-chat-react/commit/aa1624a619a89351217ad8e5512b4471512db4ba))
* extract CardAudio and render only uploaded audio data in Audio component ([8027908](https://github.com/GetStream/stream-chat-react/commit/80279083cbd336cf3a8de2a5ce4658e1926aa838))
* include the parent message in virtualized scrollable message list ([dd63427](https://github.com/GetStream/stream-chat-react/commit/dd63427376460ca964b8560fc6086adbe8049fa2))
* message is considered top if it has reactions and bottom if the next message has reactions ([638aead](https://github.com/GetStream/stream-chat-react/commit/638aead0c3dd8202653d25351402f73c84f23909))
* **MessageInput:** add drag & drop upload functionality ([e731b67](https://github.com/GetStream/stream-chat-react/commit/e731b676af8a9b9bfc81e87a0a3b5af506ab4ea0))
* **ProgressBar:** add "seeking" feature to the progress bar ([0320864](https://github.com/GetStream/stream-chat-react/commit/032086456bb76a36f51fa701faf5f5fb60671548))
* **ProgressBar:** add onClick property ([4d9d06c](https://github.com/GetStream/stream-chat-react/commit/4d9d06c9fa3aa2426fb61d78dc331856db6a02da))
* remove avatar from the thread header ([dec0d8d](https://github.com/GetStream/stream-chat-react/commit/dec0d8ddaff5d87d130aa08e90f68b9270da145a))
* remove deprecated components: MessageCommerce, MessageLivestream, MessageTeam ([9d75fb8](https://github.com/GetStream/stream-chat-react/commit/9d75fb892e20cbdfd705cc94210c2ae12a5f9650))
* remove translations for deprecated components: MessageCommerce, MessageLivestream, MessageTeam ([e524d0a](https://github.com/GetStream/stream-chat-react/commit/e524d0a986c0f417d3a0c1106d1134856b32d5eb))
* render cards for each attachment with scraped data ([0a59806](https://github.com/GetStream/stream-chat-react/commit/0a598067bf1dad6a8bb4451ba2338ec3ec0d5d9c))
* show always ScrollToBottomButton on scroll up and show unread message count ([e554356](https://github.com/GetStream/stream-chat-react/commit/e5543560c8ae52c38980892cdc4bd86c201a9b58))
* stop using FixedHeightMessage as default VirtualMessage component ([fc67915](https://github.com/GetStream/stream-chat-react/commit/fc67915f36c31c4302b325250376d8de8cb26eb2))
* switch ladle to v2 ([ecd1cc6](https://github.com/GetStream/stream-chat-react/commit/ecd1cc6e2774ace8daed2e364a44db1d7ba48179))
* **theming-v2:** add channel search for theme v2 ([#1685](https://github.com/GetStream/stream-chat-react/issues/1685)) ([b735c30](https://github.com/GetStream/stream-chat-react/commit/b735c30817e0113aec58761aa166351fae5691b9)), closes [#1669](https://github.com/GetStream/stream-chat-react/issues/1669)
* **TypingIndicator:** add translations ([f079e26](https://github.com/GetStream/stream-chat-react/commit/f079e26a48942b1a945e2e00e09ae1f2810ae427))
* update message componets with theme v2 designs ([e5192d5](https://github.com/GetStream/stream-chat-react/commit/e5192d59b29625a3b961b4a130f1368de0f8a5d7))
* use FileIcon with version in UploadsPreview ([4d150b1](https://github.com/GetStream/stream-chat-react/commit/4d150b108ef8bc406800ad7bd7edc1c4f8afcc66))
* wrap ThreadHead content in a div to enable styling for class str-chat__parent-message-li ([9323edb](https://github.com/GetStream/stream-chat-react/commit/9323edb46aa0bf0c83d23817698756d9cbdf2da4))


### Reverts

* fix: File attachment UI in theme-v1 ([789dd27](https://github.com/GetStream/stream-chat-react/commit/789dd273b016be42f72baeeb0423f79f380e05eb))


### BREAKING CHANGES

* ThemingV2 - user testing and adjustments
* useMobilePress and useBreakpoint hooks are removed.

useMobilePress:
Historically, this hook programmatically handled the user interaction with Message components
by toggling `mobile-press` class upon user interaction.
The goal of this operation was to have the message actions displayed on the screen.
Internally, we found a better solution by offloading this behavior to the browser and
utilizing `:focus` and `:focus-within` CSS pseudo-selectors.

useBreakpoint:
This hook did hold the "programmatic" responsive UI breakpoints.
We realized they aren't always in line with our stylesheet breakpoints and possibly with our
customer's breakpoints. This misalignment was causing some inconsistencies and issues.
We are removing this hook because we believe defining UI breakpoints should be
responsibility of our customers.

SearchResults:
During the refactoring, we stumbled upon one side-effect where `popupResults` prop
wasn't always respected. The fix of it could be a breaking change for a small percentage
of our customers, but we believe this fix is the right thing to do.

## [9.5.1](https://github.com/GetStream/stream-chat-react/compare/v9.5.0...v9.5.1) (2022-09-08)


### Bug Fixes

* avoid race condition crash in jumping ([488a1b1](https://github.com/GetStream/stream-chat-react/commit/488a1b1981eeecedb5d26b22dff581f6cf9a5338))

# [9.5.0](https://github.com/GetStream/stream-chat-react/compare/v9.4.1...v9.5.0) (2022-08-29)


### Bug Fixes

* include mdast-util-find-and-replace into our CJS bundle ([#1702](https://github.com/GetStream/stream-chat-react/issues/1702)) ([61c4eec](https://github.com/GetStream/stream-chat-react/commit/61c4eecf5c03ab36109a94b7afa5f678e99fcc8b)), closes [#1698](https://github.com/GetStream/stream-chat-react/issues/1698)
* prevent double submissions in korean ([#1720](https://github.com/GetStream/stream-chat-react/issues/1720)) ([5d781d8](https://github.com/GetStream/stream-chat-react/commit/5d781d896cb9153bcf3554d04714215c0bbf5c12))
* replace FileReader with URL.createObjectURL ([#1701](https://github.com/GetStream/stream-chat-react/issues/1701)) ([c8a490e](https://github.com/GetStream/stream-chat-react/commit/c8a490ebc53da03c2b0f064de88c0cb634ed2a70))
* **Vite:** add emoji-mart (emoji, picker) re-export ([#1724](https://github.com/GetStream/stream-chat-react/issues/1724)) ([c90cf4b](https://github.com/GetStream/stream-chat-react/commit/c90cf4bfc6b6aa74233fd041200e8180a70604e4))


### Features

* increase and support overriding jump to message limit ([#1718](https://github.com/GetStream/stream-chat-react/issues/1718)) ([8c720f4](https://github.com/GetStream/stream-chat-react/commit/8c720f41e349f753a126ad5e062c1475e3893771))

## [9.4.1](https://github.com/GetStream/stream-chat-react/compare/v9.4.0...v9.4.1) (2022-08-04)


### Bug Fixes

* include mdast-util-find-and-replace into our CJS bundle ([#1702](https://github.com/GetStream/stream-chat-react/issues/1702)) ([#1703](https://github.com/GetStream/stream-chat-react/issues/1703)) ([8010889](https://github.com/GetStream/stream-chat-react/commit/801088972032dcfd0374b00aa424a5952b7e72ae)), closes [#1698](https://github.com/GetStream/stream-chat-react/issues/1698)

# [9.4.0](https://github.com/GetStream/stream-chat-react/compare/v9.3.0...v9.4.0) (2022-08-03)


### Bug Fixes

* detect mentions of users who have email as their name ([#1698](https://github.com/GetStream/stream-chat-react/issues/1698)) ([367b7c4](https://github.com/GetStream/stream-chat-react/commit/367b7c4cb30454140ff113e2b0a2671a14d9d276))


### Features

* allow to send custom message data when editing a message ([#1696](https://github.com/GetStream/stream-chat-react/issues/1696)) ([05eae28](https://github.com/GetStream/stream-chat-react/commit/05eae28cd04f1605ae3fb1cd5767fa4bbbd067d3))

# [9.3.0](https://github.com/GetStream/stream-chat-react/compare/v9.2.0...v9.3.0) (2022-07-29)


### Bug Fixes

* scroll to bottom on new message notification click after message list pagination ([#1689](https://github.com/GetStream/stream-chat-react/issues/1689)) ([d8f4bc5](https://github.com/GetStream/stream-chat-react/commit/d8f4bc57a602e5deeefeb0c8419658c61c7e695a))
* update types for suggestions ([#1691](https://github.com/GetStream/stream-chat-react/issues/1691)) ([bb7442c](https://github.com/GetStream/stream-chat-react/commit/bb7442cbf4bb709ac477fc59f0ee35afb60888d5)), closes [#1659](https://github.com/GetStream/stream-chat-react/issues/1659)


### Features

* **message-status:** extendable user information in read-by tooltip ([#1670](https://github.com/GetStream/stream-chat-react/issues/1670)) ([902029a](https://github.com/GetStream/stream-chat-react/commit/902029a3c9f7a720d0265dcfeb1957b17b8bdc9a))

# [9.2.0](https://github.com/GetStream/stream-chat-react/compare/v9.1.5...v9.2.0) (2022-07-26)


### Features

* add autoscrollToBottom to message context ([#1681](https://github.com/GetStream/stream-chat-react/issues/1681)) ([a616184](https://github.com/GetStream/stream-chat-react/commit/a6161843509c55e9b432f4f66dfb344f0faa8b18))

## [9.1.5](https://github.com/GetStream/stream-chat-react/compare/v9.1.4...v9.1.5) (2022-07-15)


### Bug Fixes

* align user role checks with channel membership, deprecate isModerator, isAdmin, isOwner ([#1666](https://github.com/GetStream/stream-chat-react/issues/1666)) ([31f0916](https://github.com/GetStream/stream-chat-react/commit/31f09168fafe054c102ea85905243a1915fb957d))
* allow quoting quoted messages ([#1662](https://github.com/GetStream/stream-chat-react/issues/1662)) ([36dbc82](https://github.com/GetStream/stream-chat-react/commit/36dbc82df0c17939f603f6f6c33acb472cd40f9b))
* **Channel:** allow usage of custom message ID in sendMessage ([#1663](https://github.com/GetStream/stream-chat-react/issues/1663)) ([41bae84](https://github.com/GetStream/stream-chat-react/commit/41bae841568e661339277e0b241be4cbe83b2030))
* initial load earlier in vml persists the position ([#1640](https://github.com/GetStream/stream-chat-react/issues/1640)) ([dd53d5c](https://github.com/GetStream/stream-chat-react/commit/dd53d5c1fe2707d8807cfec341fbbdd612ff7cfd)), closes [/github.com/petyosi/react-virtuoso/blob/master/e2e/prepend-items.test.ts#L27-L34](https://github.com//github.com/petyosi/react-virtuoso/blob/master/e2e/prepend-items.test.ts/issues/L27-L34)

## [9.1.4](https://github.com/GetStream/stream-chat-react/compare/v9.1.3...v9.1.4) (2022-06-22)


### Bug Fixes

* respect updates to messageActions prop, support messageActions overrides in Thread ([#1634](https://github.com/GetStream/stream-chat-react/issues/1634)) ([aed8e01](https://github.com/GetStream/stream-chat-react/commit/aed8e0159b12f221d8a8716c1998ccff29f5cc73)), closes [#1627](https://github.com/GetStream/stream-chat-react/issues/1627)

## [9.1.3](https://github.com/GetStream/stream-chat-react/compare/v9.1.2...v9.1.3) (2022-06-19)


### Bug Fixes

* correct calculation of scrollback with date separators ([#1628](https://github.com/GetStream/stream-chat-react/issues/1628)) ([88a4d64](https://github.com/GetStream/stream-chat-react/commit/88a4d6413c15b52d394ab338c8348664debfd1a2))
* upgrade react-player to its latest version ([#1629](https://github.com/GetStream/stream-chat-react/issues/1629)) ([8848700](https://github.com/GetStream/stream-chat-react/commit/88487001de49dceded0bd950f35d527a0c2526e1))

## [9.1.2](https://github.com/GetStream/stream-chat-react/compare/v9.1.1...v9.1.2) (2022-06-13)


### Bug Fixes

* add check if window is defined before using ResizeObserve ([f04e23e](https://github.com/GetStream/stream-chat-react/commit/f04e23e2f07edc2bba7bee85ac297e1a7b920c2b))

## [9.1.1](https://github.com/GetStream/stream-chat-react/compare/v9.1.0...v9.1.1) (2022-06-10)


### Bug Fixes

* calculate jumped-to-message position correctly by keeping the loading indicator mounted ([671375a](https://github.com/GetStream/stream-chat-react/commit/671375ab3ad89b4a4bd011748264f00021fe144b))

# [9.1.0](https://github.com/GetStream/stream-chat-react/compare/v9.0.0...v9.1.0) (2022-06-03)


### Bug Fixes

* filter out OG scraped images from attachments ([#1598](https://github.com/GetStream/stream-chat-react/issues/1598)) ([9d9c8b9](https://github.com/GetStream/stream-chat-react/commit/9d9c8b99339c58eb435dbe57703a991b8c671dd0))


### Features

* add optional renderChannels prop to ChannelList ([#1572](https://github.com/GetStream/stream-chat-react/issues/1572)) ([8edca9e](https://github.com/GetStream/stream-chat-react/commit/8edca9e64b7494d0900cafa5194186cf3c273cd1))
* lift channels query state to chat context ([#1606](https://github.com/GetStream/stream-chat-react/issues/1606)) ([ed4febc](https://github.com/GetStream/stream-chat-react/commit/ed4febc864f9a5e476e13a4bbcf434c167f3e8d7))
* use ResizeObserver to keep Channel scrolled to bottom on page load ([#1608](https://github.com/GetStream/stream-chat-react/issues/1608)) ([c33e155](https://github.com/GetStream/stream-chat-react/commit/c33e1552747ed8a60ffb7da1313451603db07d80))

## [9.0.0](https://github.com/GetStream/stream-chat-react/compare/v8.2.0...v9.0.0) (2022-05-17)

### Bug Fixes

* display textarea defaultValue in MessageInput ([#1570](https://github.com/GetStream/stream-chat-react/issues/1570)) ([516a56b](https://github.com/GetStream/stream-chat-react/commit/516a56b8b8a24739f66c0d7b47c159d6bca7d3be))

### Features

* **MessageInput:** add shouldSubmit, remove keycodeSubmitKeys ([8e2cddd](https://github.com/GetStream/stream-chat-react/pull/1534/commits/8e2cdddddd256ec1ab77ba2bc7d59a40cfba7b11)), closes [#1530](https://github.com/GetStream/stream-chat-react/issues/1530)
* add support for React 18 ([#1534](https://github.com/GetStream/stream-chat-react/issues/1534)) ([39cedcb](https://github.com/GetStream/stream-chat-react/commit/39cedcb8d0821e4bb6e8061349ae52132aa32c45))

### BREAKING CHANGES

* **MessageInput:** property  has been fully removed and replaced by the  property
which should handle custom submit "trigger" functionality.
Both `listener.js` and usage of key codes were outdated and caused unnecessary issues.

# [8.2.0](https://github.com/GetStream/stream-chat-react/compare/v8.1.3...v8.2.0) (2022-05-17)


### Bug Fixes

* display textarea defaultValue in MessageInput ([#1570](https://github.com/GetStream/stream-chat-react/issues/1570)) ([516a56b](https://github.com/GetStream/stream-chat-react/commit/516a56b8b8a24739f66c0d7b47c159d6bca7d3be))


### Features

* add support for React 18 ([#1534](https://github.com/GetStream/stream-chat-react/issues/1534)) ([39cedcb](https://github.com/GetStream/stream-chat-react/commit/39cedcb8d0821e4bb6e8061349ae52132aa32c45)), closes [#1530](https://github.com/GetStream/stream-chat-react/issues/1530)

## [8.1.3](https://github.com/GetStream/stream-chat-react/compare/v8.1.2...v8.1.3) (2022-05-15)


### Bug Fixes

* do not scroll thread message list when a new message is received ([#1568](https://github.com/GetStream/stream-chat-react/issues/1568)) ([b17c48a](https://github.com/GetStream/stream-chat-react/commit/b17c48ae87176ed8c7f54230ea67934774877210))
* propagate user update data to UI ([#1566](https://github.com/GetStream/stream-chat-react/issues/1566)) ([3376e4c](https://github.com/GetStream/stream-chat-react/commit/3376e4ca736c0ac722bf7f71a2345e59aedf0fe0))

## [8.1.2](https://github.com/GetStream/stream-chat-react/compare/v8.1.1...v8.1.2) (2022-04-27)


### Bug Fixes

* display overlay "X more" on Gallery only if more images uploaded than displayed ([#1526](https://github.com/GetStream/stream-chat-react/issues/1526)) ([ed47cd1](https://github.com/GetStream/stream-chat-react/commit/ed47cd1e0d2df6b2af72ae33e5c1b2efffec1591))


## [8.1.1](https://github.com/GetStream/stream-chat-react/compare/v8.1.0...v8.1.1) (2022-04-18)


### Bug Fixes

* prevent duplicate message id generation in message list ([#1516](https://github.com/GetStream/stream-chat-react/issues/1516)) ([b381402](https://github.com/GetStream/stream-chat-react/commit/b38140211582e6c80a3e0a8e9b5a6a34cb973f2e))
* update `stream-chat-js` to version 6.5.0 containing the `markRead` fix, add E2E tests ([#1514](https://github.com/GetStream/stream-chat-react/issues/1514)) ([b8e1084](https://github.com/GetStream/stream-chat-react/commit/b8e10844ba2db8dca898eeadac96c4f641e78432))


## [8.1.0](https://github.com/GetStream/stream-chat-react/compare/v8.0.0...v8.1.0) (2022-04-08)


### Bug Fixes

* adjust links to stories used by add-message e2e tests ([c6dc53a](https://github.com/GetStream/stream-chat-react/commit/c6dc53ae18c0b03905a1f05452bcec6a610a6ca5))
* autocomplete items clicking works on webkit ([#1494](https://github.com/GetStream/stream-chat-react/issues/1494)) ([4f73f14](https://github.com/GetStream/stream-chat-react/commit/4f73f145b877419a4d745c96f8b0096ac5a52ac3))
* correct german calendar translation strings ([#1468](https://github.com/GetStream/stream-chat-react/issues/1468)) ([2471d4b](https://github.com/GetStream/stream-chat-react/commit/2471d4bcd227c7c7991d5791bd304409605349ac)), closes [#1467](https://github.com/GetStream/stream-chat-react/issues/1467)
* fixed connection handling, updated configuration ([0face10](https://github.com/GetStream/stream-chat-react/commit/0face104ba81c3ca6495e63132af003a90228cc9))
* improve portuguese translations ([5e67a86](https://github.com/GetStream/stream-chat-react/commit/5e67a865a8211956c3a86980cc2896f4e3f059ff))
* improved German translations ([c4d71b6](https://github.com/GetStream/stream-chat-react/commit/c4d71b6f5b2e07ace0ee7644664ebabff2526138))
* improved German translations ([a6fe4fb](https://github.com/GetStream/stream-chat-react/commit/a6fe4fbed906c102728bb18f97fee21f978f322a))
* Slow mode role check and limitations ([a447ed5](https://github.com/GetStream/stream-chat-react/commit/a447ed5b2945e7f669d414ed820c2585bbdd04e9))
* Update channel preview on connection recovery ([92f81d9](https://github.com/GetStream/stream-chat-react/commit/92f81d9831e6c84501550ee259939d872a2c66a5))
* Update quoted message preview on message update ([#1503](https://github.com/GetStream/stream-chat-react/issues/1503)) ([f9a0081](https://github.com/GetStream/stream-chat-react/commit/f9a0081af3576f187883f649cf0a1f807b47ee44))
* update unread counts for each ChannelPreview on WS connection recovery ([b267a65](https://github.com/GetStream/stream-chat-react/commit/b267a65c31ac97ee60d3a2681b26cfc610501a38))
* Upload preview overflow in thread ([#1495](https://github.com/GetStream/stream-chat-react/issues/1495)) ([518d622](https://github.com/GetStream/stream-chat-react/commit/518d622f8b716a6c622a65816eae16f50e9545e5))


### Features

* support jump to message ([#1478](https://github.com/GetStream/stream-chat-react/issues/1478)) ([e297ffe](https://github.com/GetStream/stream-chat-react/commit/e297ffed906bd24ba68698cf704f9d08610d1314))


## [8.0.0](https://github.com/GetStream/stream-chat-react/releases/tag/v7.0.0) 2022-03-17

### Bug Fixes

* improve performance of VirtualizedMessageList ([d2f28af](https://github.com/GetStream/stream-chat-react/commit/d2f28af0efc26a029062c36790975d00cdcfde1d))
* maintain correct reference to values inside doMarkReadRequest ([#1442](https://github.com/GetStream/stream-chat-react/issues/1442)) ([30b79d6](https://github.com/GetStream/stream-chat-react/commit/30b79d6ff8270df1054dec644391eb313ada9dd7)), closes [#1324](https://github.com/GetStream/stream-chat-react/issues/1324)
* make scrollToLatestMessageOnFocus smarter ([f37b193](https://github.com/GetStream/stream-chat-react/commit/f37b1937ab2f20b95496a79f2b243168a5b13061)), closes [#1415](https://github.com/GetStream/stream-chat-react/issues/1415)
* move UploadsPreview outside textarea wrapper ([#1454](https://github.com/GetStream/stream-chat-react/issues/1454)) ([8ebbf29](https://github.com/GetStream/stream-chat-react/commit/8ebbf29fa6d3041d6357c2b373b8a71bac21186c))
* name from StreamChatType to StreamChatGenerics ([653aef3](https://github.com/GetStream/stream-chat-react/commit/653aef3d27078fa9659bb39afea4a06398b882f8))
* remove obsolete polyfill ([2b13594](https://github.com/GetStream/stream-chat-react/commit/2b13594c42d72e6b7de8ad1a0834579f73e8f949)), closes [#1375](https://github.com/GetStream/stream-chat-react/issues/1375)
* remove translation warning ([3d951f2](https://github.com/GetStream/stream-chat-react/commit/3d951f27ad550c0efb861f4bcb4f611efaf795e1))

### Features

* onBlur prop for ChatAutoComplete ([c9897f4](https://github.com/GetStream/stream-chat-react/commit/c9897f422d0d04d606f149965b510bee749e0151)), closes [#1345](https://github.com/GetStream/stream-chat-react/issues/1345)
* support choosing a giphy version ([0d97fc6](https://github.com/GetStream/stream-chat-react/commit/0d97fc62d4e5f166162e1d375689196305fad420))

### ⚠️ BREAKING CHANGES ⚠️

* All types now accept a single generic ([help article](https://getstream.io/chat/docs/sdk/react/customization/typescript_and_generics/))


## [7.0.0](https://github.com/GetStream/stream-chat-react/releases/tag/v7.0.0) 2022-02-10

### ⚠️ BREAKING CHANGES ⚠️

- Replace stale `react-images` dependency with `react-image-gallery`, removed `ModalImage` [#1318](https://github.com/GetStream/stream-chat-react/pull/1318)
- Add support for accessibility through the use of semantic HTML, ARIA attributes. Updates include changing HTML elements to different types as necessary [#1314](https://github.com/GetStream/stream-chat-react/pull/1314) and [#1294](https://github.com/GetStream/stream-chat-react/pull/1294)

### Feature

* Add support for `QuotedMessages` in a `Thread` [#1356](https://github.com/GetStream/stream-chat-react/pull/1356)
* Add `wordReplace` prop to `ChatAutoComplete` to override default behavior [#1347](https://github.com/GetStream/stream-chat-react/pull/1347)

### Chore

* Fix small documentation typo [#1312](https://github.com/GetStream/stream-chat-react/pull/1312)
* Improve compatibility with NextJS [#1315](https://github.com/GetStream/stream-chat-react/pull/1315)
* Use the `Avatar` from the `ComponentContext` in `QuotedMessagePreview` [#1311](https://github.com/GetStream/stream-chat-react/pull/1311)
* Set `ImagePreviewer` to disabled if multiple uploads is not allowed [#1330](https://github.com/GetStream/stream-chat-react/pull/1330)
* Export `QuotedMessagePreview` component [#1339](https://github.com/GetStream/stream-chat-react/pull/1339)
* Add guide on how to build a custom list with channel members and have real time updates of their online status [#1350](https://github.com/GetStream/stream-chat-react/pull/1350)
* Support URLs with encoded components [#1353](https://github.com/GetStream/stream-chat-react/pull/1353)
* Remove UNSAFE warning from `AutoCompleteTextarea` [#1354](https://github.com/GetStream/stream-chat-react/pull/1354)
* Add current text to `openMentionsList` method [#1360](https://github.com/GetStream/stream-chat-react/pull/1360)
* Update to `Window`'s `hideOnThread` prop to handle via CSS [#1363](https://github.com/GetStream/stream-chat-react/pull/1363)
* Upgrade stream-chat-css dependency to v2.2.1 [#1365](https://github.com/GetStream/stream-chat-react/pull/1365)

### Bug

* Fix the logic for the `VirtualizedMessageList`'s `firstOfGroup` prop [#1338](https://github.com/GetStream/stream-chat-react/pull/1338)
* Fix bug where on `channel.updated` event `own_capabilities` and `hidden` values are lost [#1346](https://github.com/GetStream/stream-chat-react/pull/1346)
* Add a fix so quotes (aka replies) are not still available in message options when quotes are disabled in configuration [#1364](https://github.com/GetStream/stream-chat-react/pull/1364)


## [6.12.2](https://github.com/GetStream/stream-chat-react/releases/tag/v6.12.2) 2021-12-09

### Feature

* Add `closeEmojiPickerOnClick` and added focus to input after Emoji or attachment selection [#1292](https://github.com/GetStream/stream-chat-react/pull/1292)

### Chore

* Update Japanese and Korean translations [#1296](https://github.com/GetStream/stream-chat-react/pull/1296)
* Fix broken documentation links [#1300](https://github.com/GetStream/stream-chat-react/pull/1300)
* Add updated scoped CSS dependency `stream-chat-css` NPM package [#1301](https://github.com/GetStream/stream-chat-react/pull/1301)
* Upgrade `stream-chat-css` dependency to v1.1.3 [#1306](https://github.com/GetStream/stream-chat-react/pull/1306)
* Upgrade `react-virtuoso` to improve stability [#1304](https://github.com/GetStream/stream-chat-react/pull/1304)
* Upgrade `stream-chat` dependency to v4.0.0

## [6.12.0](https://github.com/GetStream/stream-chat-react/releases/tag/v6.12.0) 2021-11-22

### Feature

* Add ability to manually open/close mentions list [#1261](https://github.com/GetStream/stream-chat-react/pull/1261)
* Support custom message group CSS classes [#1287](https://github.com/GetStream/stream-chat-react/pull/1287)
* Ability to drag and drop files to the entire window [#1283](https://github.com/GetStream/stream-chat-react/pull/1283)
* Add semantic release [#1293](https://github.com/GetStream/stream-chat-react/pull/1293)

### Chore

* Render reaction list for frozen channels [#1262](https://github.com/GetStream/stream-chat-react/pull/1262)
* Remove unsafe props from `Textarea` component [#1263](https://github.com/GetStream/stream-chat-react/pull/1263)
* Use context `Avatar` in `QuotedMessage` and `TypingIndicator` [#1264](https://github.com/GetStream/stream-chat-react/pull/1264)
* Pass `setChannels` state hook to list UI component [#1265](https://github.com/GetStream/stream-chat-react/pull/1265)
* Update user info in messages when subscribed to presence events [#1267](https://github.com/GetStream/stream-chat-react/pull/1267)
* File and image attachments are now filtered according [to the application settings](https://getstream.io/chat/docs/other-rest/app_setting_overview/#file-uploads) [#1291](https://github.com/GetStream/stream-chat-react/pull/1291)
* Check for already encoded URLs in a message [#1288](https://github.com/GetStream/stream-chat-react/pull/1288)
* Set reset state to false in `usePaginatedChannels` [#1289](https://github.com/GetStream/stream-chat-react/pull/1289)


* File and Image attachments are now filtered according [to the application settings](https://getstream.io/chat/docs/other-rest/app_setting_overview/#file-uploads) [#1291](https://github.com/GetStream/stream-chat-react/pull/1291)
* Check for already encoded URLs in a message [#1288](https://github.com/GetStream/stream-chat-react/pull/1288)
* Set reset state to false in `usePaginatedChannels` [#1289](https://github.com/GetStream/stream-chat-react/pull/1289)


## [6.11.0](https://github.com/GetStream/stream-chat-react/releases/tag/v6.11.0) 2021-10-28

### Feature

- Support custom notifications in the `VirtualizedMessageList` component [#1245](https://github.com/GetStream/stream-chat-react/pull/1245)

### Chore

- Update type definitions for `emoji-mart` and `moment` dependencies [#1254](https://github.com/GetStream/stream-chat-react/pull/1254)
- Add Vite app to examples directory [#1255](https://github.com/GetStream/stream-chat-react/pull/1255)
- Upgrade `react-virtuoso` to fix Safari v15 edge case [#1257](https://github.com/GetStream/stream-chat-react/pull/1257)
- Deprecate the `theme` prop on the `Chat` component [#1258](https://github.com/GetStream/stream-chat-react/pull/1258)
- Upgrade `mml-react` dependency [#1260](https://github.com/GetStream/stream-chat-react/pull/1260)

## [6.10.0](https://github.com/GetStream/stream-chat-react/releases/tag/v6.10.0) 2021-10-13

### Feature

- Export markdown utils functions used within `renderText` [#1228](https://github.com/GetStream/stream-chat-react/pull/1228)
- Use `own_capabilities` field on `channel` to determine connected user permissions [#1232](https://github.com/GetStream/stream-chat-react/pull/1232)
- Pass component names to custom context hooks for error tracing [#1238](https://github.com/GetStream/stream-chat-react/pull/1238)

### Chore

- Update German i18n translations [#1224](https://github.com/GetStream/stream-chat-react/pull/1224)
- Upgrade `react-virtuoso` for zoom fix [#1233](https://github.com/GetStream/stream-chat-react/pull/1233)
- Use optional `activeUnreadHandler` in `Channel` component's `markRead` function when provided [#1237](https://github.com/GetStream/stream-chat-react/pull/1237)
- Replace custom context hook error throws with console warnings [#1242](https://github.com/GetStream/stream-chat-react/pull/1242)

### Bug

- Fix UI header bug for Levenshtein autocomplete mention search [#1235](https://github.com/GetStream/stream-chat-react/pull/1235)
- Ensure `channelConfig` is updated when `Channel` mounts an unwatched channel [#1239](https://github.com/GetStream/stream-chat-react/pull/1239)

## [6.9.1](https://github.com/GetStream/stream-chat-react/releases/tag/v6.9.1) 2021-10-01

### Feature

- Add `chatContainer` custom CSS class name override [#1216](https://github.com/GetStream/stream-chat-react/pull/1216)

### Chore

- Add descriptive error messages to custom context consumer hooks [#1207](https://github.com/GetStream/stream-chat-react/pull/1207)
- Pass `value` prop to `SuggestionItem` component [#1207](https://github.com/GetStream/stream-chat-react/pull/1207)
- Update docs for custom `ChannelList` event handler example [#1209](https://github.com/GetStream/stream-chat-react/pull/1209)
- Add `cooldownInterval` to `MessageInput` context value memoization [#1209](https://github.com/GetStream/stream-chat-react/pull/1209)
- Reduce packaged CSS bundle size [#1219](https://github.com/GetStream/stream-chat-react/pull/1219)

### Bug

- Prevent user start/stop watching events from resetting the channel state [#1206](https://github.com/GetStream/stream-chat-react/pull/1206)

## [6.9.0](https://github.com/GetStream/stream-chat-react/releases/tag/v6.9.0) 2021-09-24

### Feature

- Add new virtual event example app [#1189](https://github.com/GetStream/stream-chat-react/pull/1189)
- Memoize object values injected into context providers [#1194](https://github.com/GetStream/stream-chat-react/pull/1194)
- Support emojis as the first character in a user name for the `Avatar` component's fallback [#1201](https://github.com/GetStream/stream-chat-react/pull/1201)
- Provide the option to pass additional props to the `Virtuoso` component in the `VirtualizedMessageList` [#1202](https://github.com/GetStream/stream-chat-react/pull/1202)

 ### Chore
- Improve documentation around approved attachment types [#1190](https://github.com/GetStream/stream-chat-react/pull/1190)
- Upgrade `react-virtuoso` dependency [#1194](https://github.com/GetStream/stream-chat-react/pull/1194)
- Refactor `ChannelList` pagination offset logic to handle channels being added/removed from the list [#1200](https://github.com/GetStream/stream-chat-react/pull/1200)

## [6.8.0](https://github.com/GetStream/stream-chat-react/releases/tag/v6.8.0) 2021-09-17

### Feature

- Improve user mention experience by ignoring diacritics, adding a `useMentionsTransliteration` prop to install an optional transliteration dependency, and using Levenshtein distance to match similar names [#1176](https://github.com/GetStream/stream-chat-react/pull/1176)
- Add event listener to `ChannelPreview` to handle `markAllRead` function calls on the client [#1178](https://github.com/GetStream/stream-chat-react/pull/1178)
- Add `setText` function to `MessageInputContext`, which overrides and sets the value of the `MessageInput` component's `textarea` element [#1184](https://github.com/GetStream/stream-chat-react/pull/1184)
- Add `activeUnreadHandler` prop to `Channel`, which runs when the active channel has unread messages [#1185](https://github.com/GetStream/stream-chat-react/pull/1185)

 ### Chore
- Remove all SCSS files and import library styles from `stream-chat-css` dependency. This is non-breaking as the build process injects the external styles into the exact distributed directory as before. [#1168](https://github.com/GetStream/stream-chat-react/pull/1168)
- Upgrade `stream-chat` and `react-file-utils` dependencies [#1178](https://github.com/GetStream/stream-chat-react/pull/1178)

## [6.7.2](https://github.com/GetStream/stream-chat-react/releases/tag/v6.7.2) 2021-09-15

### Feature

- Add optional `allowNewMessagesFromUnfilteredChannels` argument to `useNotificationMessageNewListener` and `useNotificationAddedToChannelListener` hooks to prevent channel from incrementing the list [#1175](https://github.com/GetStream/stream-chat-react/pull/1175)

### Bug

- Fix issue with autocomplete mentions displaying muted users [#1171](https://github.com/GetStream/stream-chat-react/pull/1171)
- Prevent user mention edge case crash [#1172](https://github.com/GetStream/stream-chat-react/pull/1172)
- Fix reaction handler edge case on mobile web use case [#1173](https://github.com/GetStream/stream-chat-react/pull/1173)
- Add missing default value for `publishTypingEvent` `MessageInput` prop [#1174](https://github.com/GetStream/stream-chat-react/pull/1174)

## [6.7.1](https://github.com/GetStream/stream-chat-react/releases/tag/v6.7.1) 2021-09-14

### Bug

- Prevent custom message data from being deleted on edit message request [#1169](https://github.com/GetStream/stream-chat-react/pull/1169)
- Fix issue with autocomplete mentions displaying muted users [#1170](https://github.com/GetStream/stream-chat-react/pull/1170)

## [6.7.0](https://github.com/GetStream/stream-chat-react/releases/tag/v6.7.0) 2021-09-10

### Feature

- Add ability to override high-level, CSS container classes via the `customClasses` prop on `Chat` [#1159](https://github.com/GetStream/stream-chat-react/pull/1159). See the [docs](https://getstream.io/chat/docs/sdk/react/customization/css_and_theming/#custom-container-classes) for more information.
- Allow custom message actions in the `VirtualizedMessageList` [#1166](https://github.com/GetStream/stream-chat-react/pull/1166)
- While using the `MessageSimple` UI component, allow message grouping in the `VirtualizedMessageList` via the `shouldGroupByUser` prop [#1166](https://github.com/GetStream/stream-chat-react/pull/1166)
- Add ability to customize the svg icons in the `MessageOptions` component [#1159](https://github.com/GetStream/stream-chat-react/pull/1159)
- Create a Capacitor sample app to test run the library natively [#1158](https://github.com/GetStream/stream-chat-react/pull/1158)

### Bug

- Fix edge case around custom message actions not showing up when default actions are disabled [#1161](https://github.com/GetStream/stream-chat-react/pull/1161)

## [6.6.0](https://github.com/GetStream/stream-chat-react/releases/tag/v6.6.0) 2021-08-30

### Feature

- Add optimistic response to pin message request [#1149](https://github.com/GetStream/stream-chat-react/pull/1149)
- Add option to close `ReactionSelector` component on reaction pick [#1150](https://github.com/GetStream/stream-chat-react/pull/1150)

### Chore

- Improve `ChannelSearch` types for channel and user filters [#1141](https://github.com/GetStream/stream-chat-react/pull/1141)
- Remove unnecessary `useMessageInputState` props [#1145](https://github.com/GetStream/stream-chat-react/pull/1145)
- Upgrade `react-virtuoso` dependency [#1148](https://github.com/GetStream/stream-chat-react/pull/1148)
- Add Rollup image plugin and upgrade `react-file-utils` [#1151](https://github.com/GetStream/stream-chat-react/pull/1151)

### Bug

- Hide URL link overflow in `MessageSimple` [#1147](https://github.com/GetStream/stream-chat-react/pull/1147)

## [6.5.1](https://github.com/GetStream/stream-chat-react/releases/tag/v6.5.1) 2021-08-13

### Feature

- Add option to pass `customMessageData` to the `ChannelActionContext` `sendMessage` function [#1123](https://github.com/GetStream/stream-chat-react/pull/1123)

### Chore

- Add support to quote a message with an attachment [#1118](https://github.com/GetStream/stream-chat-react/pull/1118)
- Upgrade `stream-chat` to major version 4 [#1120](https://github.com/GetStream/stream-chat-react/pull/1120)

### Bug

- Skip `MessageInput` slow mode cooldown for admin and moderator user roles [#1116](https://github.com/GetStream/stream-chat-react/pull/1116)

## [6.5.0](https://github.com/GetStream/stream-chat-react/releases/tag/v6.5.0) 2021-08-11

### Feature

- Add `defaultItemHeight` prop to `VirtualizedMessageList` to smooth rendering of long and differently sized lists. Also, prevent new message notification icon from flashing when switching channels. [#1112](https://github.com/GetStream/stream-chat-react/pull/1112)

### Chore

- Improve `EmojiContext` types and documentation [#1107](https://github.com/GetStream/stream-chat-react/pull/1107)
- Adjust `Attachment` component rendering in Message UI components for cases with no attachment array length [#1115](https://github.com/GetStream/stream-chat-react/pull/1115)

## [6.4.11](https://github.com/GetStream/stream-chat-react/releases/tag/v6.4.11) 2021-08-06

### Chore

- Upgrade `react-virtuoso` for tall last message edge case [#1102](https://github.com/GetStream/stream-chat-react/pull/1102)
- Upgrade `stream-chat` and example app dependencies  [#1103](https://github.com/GetStream/stream-chat-react/pull/1103)

## [6.4.10](https://github.com/GetStream/stream-chat-react/releases/tag/v6.4.10) 2021-08-05

### Feature

- Clear message input text prior to successful message response and revert to original text if request fails [#1097](https://github.com/GetStream/stream-chat-react/pull/1097)

### Chore

- Update Japanese and Korean translations [#1091](https://github.com/GetStream/stream-chat-react/pull/1091) and [#1099](https://github.com/GetStream/stream-chat-react/pull/1099)
- Prevent `Avatar` component from being able to render its name as a number  [#1097](https://github.com/GetStream/stream-chat-react/pull/1097)

### Bug

- Fix logic to show input send button on breakpoint change to mobile/tablet views [#1095](https://github.com/GetStream/stream-chat-react/pull/1095)

## [6.4.9](https://github.com/GetStream/stream-chat-react/releases/tag/v6.4.9) 2021-08-02

### Feature

- Add `defaultLanguage` prop to `Chat` component to specify fallback language for translation of UI components [#1086](https://github.com/GetStream/stream-chat-react/pull/1086)

### Chore
- Optimize `VirtualizedMessageList` message grouping and rendering logic [#1088](https://github.com/GetStream/stream-chat-react/pull/1088)

## [6.4.8](https://github.com/GetStream/stream-chat-react/releases/tag/v6.4.8) 2021-07-30

### Feature

- Add `SearchInput` UI prop to `ChannelSearch` component to override/extend default HTML `input` element [#1079](https://github.com/GetStream/stream-chat-react/pull/1079)
- Detect connected user's preferred language for translation when language not set by `Streami18n` instance [#1082](https://github.com/GetStream/stream-chat-react/pull/1082)
- Add Japanese and Korean to list of supported languages for auto translation [#1085](https://github.com/GetStream/stream-chat-react/pull/1085)

## [6.4.7](https://github.com/GetStream/stream-chat-react/releases/tag/v6.4.7) 2021-07-27

### Feature

- Add the ability to open/close list of available commands on click [#1072](https://github.com/GetStream/stream-chat-react/pull/1072)
- Add the ability to set custom active channel on mount even if it's not returned in the initial `queryChannels` response [#1078](https://github.com/GetStream/stream-chat-react/pull/1078)

### Chore

- Replace `replaceAll` method with `replace` and add global flag for older browser support [#1074](https://github.com/GetStream/stream-chat-react/pull/1074)
- Adjust `VirtualizedMessageList` CSS to support `MessageSimple` [#1075](https://github.com/GetStream/stream-chat-react/pull/1075)

## [6.4.6](https://github.com/GetStream/stream-chat-react/releases/tag/v6.4.6) 2021-07-23

### Chore

- Add error handling to `MessageInput` submit handler functions [#1068](https://github.com/GetStream/stream-chat-react/pull/1068)
- Upgrade `react-images` dependency for React 17 support [#1069](https://github.com/GetStream/stream-chat-react/pull/1069)

## [6.4.5](https://github.com/GetStream/stream-chat-react/releases/tag/v6.4.5) 2021-07-21

### Feature

- Provide option to use `VirtualizedMessageList` in `Thread` component via the `virtualized` boolean prop [#1065](https://github.com/GetStream/stream-chat-react/pull/1065)

### Chore

- Pass `message` object override prop to `MessageText` component [#1063](https://github.com/GetStream/stream-chat-react/pull/1063)
- Add fallback `name` for specific rendered `Avatar` components [#1066](https://github.com/GetStream/stream-chat-react/pull/1066)

## [6.4.4](https://github.com/GetStream/stream-chat-react/releases/tag/v6.4.4) 2021-07-20

### Bug

- Fix bundle issues with dependency CSS imports [#1061](https://github.com/GetStream/stream-chat-react/pull/1061)

## [6.4.3](https://github.com/GetStream/stream-chat-react/releases/tag/v6.4.3) 2021-07-20

### Feature

- Reload `ChannelList` component when `sort` prop changes [#1054](https://github.com/GetStream/stream-chat-react/pull/1054)

### Chore

- Add repo info to NPM page [#1051](https://github.com/GetStream/stream-chat-react/pull/1051)
- Export `MML` component [#1053](https://github.com/GetStream/stream-chat-react/pull/1053)
- Upgrade `react-virtuoso` dependency [#1057](https://github.com/GetStream/stream-chat-react/pull/1057)
- Revert removal of `EmptyStateIndicator` component for threads [#1058](https://github.com/GetStream/stream-chat-react/pull/1058)
- Move `mml-react` (optional dependency) CSS import to `MML` component [#1059](https://github.com/GetStream/stream-chat-react/pull/1059)

## [6.4.2](https://github.com/GetStream/stream-chat-react/releases/tag/v6.4.2) 2021-07-14

### Feature

- In the `VirtualizedMessageList`, add option to view the Giphy preview above the `MessageInput` (not as a message in the list) using the `separateGiphyPreview` prop [#1045](https://github.com/GetStream/stream-chat-react/pull/1045)
- Add optimistic response for sending reactions [#1048](https://github.com/GetStream/stream-chat-react/pull/1048)

### Chore

- Upgrade `typescript` and `stream-chat` dependencies [#1049](https://github.com/GetStream/stream-chat-react/pull/1049)

## [6.4.1](https://github.com/GetStream/stream-chat-react/releases/tag/v6.4.1) 2021-07-09

### Chore

- Upgrade `react-file-utils` to fix NextJS support [#1043](https://github.com/GetStream/stream-chat-react/pull/1043)

### Bug

- Fix `offset` increment issue for unwatched channels [#1038](https://github.com/GetStream/stream-chat-react/pull/1038)

## [6.4.0](https://github.com/GetStream/stream-chat-react/releases/tag/v6.4.0) 2021-07-07

### ⚠️ BREAKING CHANGES ⚠️ - The following values have been moved to the newly created [`EmojiContext`](https://getstream.io/chat/docs/sdk/react/contexts/emoji_context/):

- `Emoji` - moved from `ComponentContext`
- `emojiConfig` - moved from `ChannelStateContext`
- `EmojiIndex` - moved from `ComponentContext`
- `EmojiPicker` - moved from `ComponentContext`

### Feature

- Lazy load the `emoji-mart` dependency [#1037](https://github.com/GetStream/stream-chat-react/pull/1037)

### Chore

- Remove unused CSS [#1035](https://github.com/GetStream/stream-chat-react/pull/1035)

## [6.3.0](https://github.com/GetStream/stream-chat-react/releases/tag/v6.3.0) 2021-07-02

### ⚠️ BREAKING CHANGES ⚠️ - We've removed the following deprecated UI components [#1031](https://github.com/GetStream/stream-chat-react/pull/1031):

- `ChannelListTeam`
- `ChannelPreviewCompact`
- `ChannelPreviewCountOnly`
- `ChannelPreviewLastMessage`
- `MessageInputLarge`
- `MessageInputSimple`

### Feature

- Added option to view read states on all messages [#1014](https://github.com/GetStream/stream-chat-react/pull/1014)
- Added markdown rendering support for `ChannelPreview` component [#1021](https://github.com/GetStream/stream-chat-react/pull/1021)
- Added `sendChannelsToList` prop to `ChannelList` to pass `loadedChannels` to the `List` UI component [#1028](https://github.com/GetStream/stream-chat-react/pull/1028)
- Pass entire user object to `Avatar` component for custom component usage [#1030](https://github.com/GetStream/stream-chat-react/pull/1030)
- Send error notification to channel via `addNotification` method when file/image upload fails [#1032](https://github.com/GetStream/stream-chat-react/pull/1032)
- Conditionally render `SendButton` when attachments have been uploaded but no input text exists [#1033](https://github.com/GetStream/stream-chat-react/pull/1033)

### Chore

- Update `MessageInput` emoji icons [#1020](https://github.com/GetStream/stream-chat-react/pull/1020) and [#1029](https://github.com/GetStream/stream-chat-react/pull/1029)
- Upgrade `react-file-utils` dependency [#1027](https://github.com/GetStream/stream-chat-react/pull/1027)

## [6.2.0](https://github.com/GetStream/stream-chat-react/releases/tag/v6.2.0) 2021-06-24

### 🎉 CSS VARIABLES THEMING! 🎉

- We've replaced much of the library's hardcoded CSS with customizable variables [#927](https://github.com/GetStream/stream-chat-react/pull/927)
- Variable support has been added for fonts, colors, border radius, padding, and margin
- The `Chat` component now accepts a `customStyles` prop, an object type of CSS variables and value overrides
- See the [CSS and Theming](https://getstream.io/chat/docs/sdk/react/customization/css_and_theming/) section of our docs
for an example of how to implement

### Feature

- Added error notification handling for failed deleted messages [#1002](https://github.com/GetStream/stream-chat-react/pull/1002)
- Added UI component override prop for `MessageListNotifications` [#996](https://github.com/GetStream/stream-chat-react/pull/996)

### Chore

- Refactor typing of `Attachment` components [#995](https://github.com/GetStream/stream-chat-react/pull/995)

## [6.1.2](https://github.com/GetStream/stream-chat-react/releases/tag/v6.1.2) 2021-06-21

### Feature

- Refactor message permissions so they respect channel config [#986](https://github.com/GetStream/stream-chat-react/pull/986)
- Add limit option to default user mention behavior [#988](https://github.com/GetStream/stream-chat-react/pull/988)
- Add additional customization for `ChannelSearch` component [#989](https://github.com/GetStream/stream-chat-react/pull/989)
- Add `formatDate` prop override potential `DateSeparator` component [#992](https://github.com/GetStream/stream-chat-react/pull/992)

### Chore

- Refactor typing of `Attachment` component [#991](https://github.com/GetStream/stream-chat-react/pull/991)

## [6.1.1](https://github.com/GetStream/stream-chat-react/releases/tag/v6.1.1) 2021-06-16

### Chore

- Upgrade TypeScript dependencies [#982](https://github.com/GetStream/stream-chat-react/pull/982)

### Bug

- Add missing `onlySenderCanEdit` prop to `Message` component [#982](https://github.com/GetStream/stream-chat-react/pull/982)

## [6.1.0](https://github.com/GetStream/stream-chat-react/releases/tag/v6.1.0) 2021-06-15

### 🎉 UPDATED DOCS! 🎉

- We have completely re-written our [SDK docs](https://getstream.io/chat/docs/sdk/react/)
- Component/props/context references are all complete
- We'll continually add to the Custom Code Examples section for easier customization
- The new docs are found on the [website](https://getstream.io/chat/docs/sdk/react/)

### Feature

- Refine edit message privileges and add `onlySenderCanEdit` prop to `MessageList` [#975](https://github.com/GetStream/stream-chat-react/pull/975)

### Chore

- Change attachment type for video messages [#976](https://github.com/GetStream/stream-chat-react/pull/976)
- Adjust mouse event listener options [#980](https://github.com/GetStream/stream-chat-react/pull/980)

### Bug

- Prevent `EmptyStateIndicator` from showing up in `Thread` [#977](https://github.com/GetStream/stream-chat-react/pull/977)

## [6.0.7](https://github.com/GetStream/stream-chat-react/releases/tag/v6.0.7) 2021-06-14

### Feature

- Add support for custom reactions [#968](https://github.com/GetStream/stream-chat-react/pull/968)

### Chore

- Upgrade `stream-chat` dependency

### Bug

- Fix UI component conditional rendering in `Attachment` [#972](https://github.com/GetStream/stream-chat-react/pull/972)
- Add needed params to `ChannelSearch` search function prop [#973](https://github.com/GetStream/stream-chat-react/pull/973)

## [6.0.6](https://github.com/GetStream/stream-chat-react/releases/tag/v6.0.6) 2021-06-02

### Chore

- Throttle send/remove message reaction functions [#953](https://github.com/GetStream/stream-chat-react/pull/953)
and [#955](https://github.com/GetStream/stream-chat-react/pull/955)

### Bug

- Restore override props on `ChatAutoComplete` component [#952](https://github.com/GetStream/stream-chat-react/pull/952)

## [6.0.5](https://github.com/GetStream/stream-chat-react/releases/tag/v6.0.5) 2021-05-28

### Feature

- Add optional prop to override default `loadMore` function in `VirtualizedMessageList` [#950](https://github.com/GetStream/stream-chat-react/pull/950)

### Bug

- Prevent unnecessary members query when `disableMentions` is enabled on `MessageInput` [#949](https://github.com/GetStream/stream-chat-react/pull/949)

## [6.0.4](https://github.com/GetStream/stream-chat-react/releases/tag/v6.0.4) 2021-05-25

### Bug

- Add missing `Input` prop to `ComponentContext` value [#942](https://github.com/GetStream/stream-chat-react/pull/942)

## [6.0.3](https://github.com/GetStream/stream-chat-react/releases/tag/v6.0.3) 2021-05-25

### Chore

- Export browser bundle as `StreamChatReact` namespace [#940](https://github.com/GetStream/stream-chat-react/pull/940)
- Use asset path scss variable [#939](https://github.com/GetStream/stream-chat-react/pull/939)

## [6.0.2](https://github.com/GetStream/stream-chat-react/releases/tag/v6.0.2) 2021-05-21

### Feature

- Add German auto translation support [#935](https://github.com/GetStream/stream-chat-react/pull/935)

### Chore

- Upgrade `react-file-utils` dependency for reduced bundle size [#933](https://github.com/GetStream/stream-chat-react/pull/933)

### Bug

- Prevent tree shaking from removing distributed CSS [#936](https://github.com/GetStream/stream-chat-react/pull/936)

## [6.0.1](https://github.com/GetStream/stream-chat-react/releases/tag/v6.0.1) 2021-05-19

### Feature

- Expose the `MessageContext` to the `VirtualizedMessageList`'s `Message` UI component [#924](https://github.com/GetStream/stream-chat-react/pull/924)

### Chore

- Reorganize component documentation for v6 [#926](https://github.com/GetStream/stream-chat-react/pull/926)

### Bug

- Prevent crash when navigate away from, and then back to, an empty channel [#931](https://github.com/GetStream/stream-chat-react/pull/931)

## [6.0.0](https://github.com/GetStream/stream-chat-react/releases/tag/v6.0.0) 2021-05-17

### ⚠️ BREAKING CHANGES ⚠️ - Please review our v6 [implementation guide](https://github.com/GetStream/stream-chat-react/wiki) prior to upgrading.

With this release, we've completely refactored how we share data in the component library. We've segmented our former `ChannelContext` into the following four sub-contexts:

- `ChannelActionContext` - provides the functions needed to operate a `Channel`
- `ChannelStateContext` - provides the stateful data needed to operate a `Channel`
- `ComponentContext` - provides the UI component overrides for all child components of a `Channel`
- `TypingContext` - provides an object of users currently typing in the `Channel`

**NOTE:** The `ChannelContext` no longer exists, so all old references to `useChannelContext()` or `useContext(ChannelContext)` need to be replaced with the relevant context above. A list of all data found within each new context can be found [here](https://github.com/GetStream/stream-chat-react/wiki/Context-Overview-(v6.0.0)).

### Feature

- We've added a handful of new features in this release, check out this [wiki](https://github.com/GetStream/stream-chat-react/wiki/New-Features-(v.6.0.0)) for more details. New features include:
  - custom message actions
  - custom triggers
  - channel search
  - quoted messages
  - cooldown timer / slow mode UI
  - submit key override
- The `Message` component now provides the `MessageContext` to its children. Reference this [guide](https://github.com/GetStream/stream-chat-react/wiki/How-to-Guide-for-Building-a-Custom-Message-(v.6.0.0)) for instructions on creating a custom message UI component.
- The `MessageInput` component now provides the `MessageInputContext` to its children. Reference this [guide](https://github.com/GetStream/stream-chat-react/wiki/How-to-Guide-for-Building-a-Custom-MessageInput-and-Customizing-the-Default-MessageInput-(v.6.0.0)) for instructions on creating a custom input UI component.

## [5.4.0](https://github.com/GetStream/stream-chat-react/releases/tag/v5.4.0) 2021-05-13

### Feature

- Scroll to bottom of `MessageList` when the last message receives a reaction or reply [#916](https://github.com/GetStream/stream-chat-react/pull/916)

### Chore

- Preserve modules during build to optimize tree shaking potential [#919](https://github.com/GetStream/stream-chat-react/pull/919)
- Support `'next-images'` dependency in NextJS sample app [#920](https://github.com/GetStream/stream-chat-react/pull/920)

## [5.3.2](https://github.com/GetStream/stream-chat-react/releases/tag/v5.3.2) 2021-05-03

### Feature

- Add `scrollToLatestMessageOnFocus` prop to `VirtualizedMessageList` to handle focus changes on browser tab switching [#892](https://github.com/GetStream/stream-chat-react/pull/892)
- Add `MessageNotification` prop to `MessageList` components to allow customization of the new messages notification popup [#894](https://github.com/GetStream/stream-chat-react/pull/894)

### Bug

- Adjust URL parsing for duplicate entries [#893](https://github.com/GetStream/stream-chat-react/pull/893)

## [5.3.1](https://github.com/GetStream/stream-chat-react/releases/tag/v5.3.1) 2021-04-30

### Bug

- Add message memoization case for read states [#888](https://github.com/GetStream/stream-chat-react/pull/888)
- Fix regex trigger for multiple mentions [#889](https://github.com/GetStream/stream-chat-react/pull/889)
- Add message memoization case for muted user array [#891](https://github.com/GetStream/stream-chat-react/pull/891)

## [5.3.0](https://github.com/GetStream/stream-chat-react/releases/tag/v5.3.0) 2021-04-29

### Feature

- Added support for `user.deleted` and `user.updated` event handling [#884](https://github.com/GetStream/stream-chat-react/pull/884)
  - Requires `stream-chat >= 3.8.0`
  - In case of `user.deleted` event, messages from corresponding user will be marked as deleted
  - In case of `user.updated` event, user property on messages from corresponding user will be updated.

## [5.2.1](https://github.com/GetStream/stream-chat-react/releases/tag/v5.2.1) 2021-04-28

### Chore

- Adjust processed messages logic [#876](https://github.com/GetStream/stream-chat-react/pull/876)
- Make `mml-react` an optional dependency and lazy load [#881](https://github.com/GetStream/stream-chat-react/pull/881)

### Bug

- Copy missing translations from built types [#879](https://github.com/GetStream/stream-chat-react/pull/879)

## [5.2.0](https://github.com/GetStream/stream-chat-react/releases/tag/v5.2.0) 2021-04-26

### Feature

- Add Spanish and Portuguese auto translation support [#874](https://github.com/GetStream/stream-chat-react/pull/874)

### Chore

- Adjust processed messages conditional logic for `VirtualizedMessageList` [#875](https://github.com/GetStream/stream-chat-react/pull/875)

## [5.1.8](https://github.com/GetStream/stream-chat-react/releases/tag/v5.1.8) 2021-04-21

### Chore

- Update message group styling defaults in message UI components [#860](https://github.com/GetStream/stream-chat-react/pull/860)
- Refine pin message permission checking [#866](https://github.com/GetStream/stream-chat-react/pull/866)

### Bug

- Update `MessageActions` event listener types [#855](https://github.com/GetStream/stream-chat-react/pull/855)
- Fix suggestion list command conditional check [#865](https://github.com/GetStream/stream-chat-react/pull/865)

## [5.1.7](https://github.com/GetStream/stream-chat-react/releases/tag/v5.1.7) 2021-04-13

### Feature

- Remove channel creator's ability to edit/delete other users' messages [#853](https://github.com/GetStream/stream-chat-react/pull/853)

### Chore

- Generalize event types to allow for greater action handler flexibility [#850](https://github.com/GetStream/stream-chat-react/pull/850)

## [5.1.6](https://github.com/GetStream/stream-chat-react/releases/tag/v5.1.6) 2021-04-10

### Feature

- Adjust message memoization for custom UI components [#849](https://github.com/GetStream/stream-chat-react/pull/849)

### Bug

- Fix CSS display issue for messages with reactions [#849](https://github.com/GetStream/stream-chat-react/pull/849)

## [5.1.5](https://github.com/GetStream/stream-chat-react/releases/tag/v5.1.5) 2021-04-09

### Chore

- Adjust submit handler types [#847](https://github.com/GetStream/stream-chat-react/pull/847)

### Bug

- Remove old CSS leading to Gatsby error [#846](https://github.com/GetStream/stream-chat-react/pull/846)

## [5.1.4](https://github.com/GetStream/stream-chat-react/releases/tag/v5.1.4) 2021-04-07

### Bug

- Filter falsey emoji search results [#843](https://github.com/GetStream/stream-chat-react/pull/843)

### Chore

- Adjust submit handler types [#844](https://github.com/GetStream/stream-chat-react/pull/844)

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
