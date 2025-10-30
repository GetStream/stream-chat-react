## [13.10.1](https://github.com/GetStream/stream-chat-react/compare/v13.10.0...v13.10.1) (2025-10-30)

### Bug Fixes

* show the message status only for the last own message when returnAllReadData is false ([#2877](https://github.com/GetStream/stream-chat-react/issues/2877)) ([7e47fda](https://github.com/GetStream/stream-chat-react/commit/7e47fda917304d5b8df339d786a2fd74a4caecf4))

## [13.10.0](https://github.com/GetStream/stream-chat-react/compare/v13.9.0...v13.10.0) (2025-10-23)

### Bug Fixes

* control SimpleAttachmentSelector display according to channel capabilities ([#2860](https://github.com/GetStream/stream-chat-react/issues/2860)) ([da9f02e](https://github.com/GetStream/stream-chat-react/commit/da9f02eaaad6e095f1258f33171f41b568356a35))
* disable reply count button when missing send-reply permission ([#2871](https://github.com/GetStream/stream-chat-react/issues/2871)) ([9e70560](https://github.com/GetStream/stream-chat-react/commit/9e70560adbd371b225cabf6646535b0b38ecb35f))
* ensure message delivery data are recalculated for the latest message delivery confirmation ([#2869](https://github.com/GetStream/stream-chat-react/issues/2869)) ([26cb181](https://github.com/GetStream/stream-chat-react/commit/26cb1815c5eac5ddff6cdd8fcdb00b40f6742686))
* ensure submenu is aligned correctly in reference to the parent menu with floating-ui/react ([#2868](https://github.com/GetStream/stream-chat-react/issues/2868)) ([fe84cf9](https://github.com/GetStream/stream-chat-react/commit/fe84cf92e668835fb26554d23cd98899a92b295e))
* exclude own read state from delivery status inference in ChannelPreview ([#2870](https://github.com/GetStream/stream-chat-react/issues/2870)) ([2e9bc6e](https://github.com/GetStream/stream-chat-react/commit/2e9bc6e0727af1faf66abe9e217c3080d79be13d))
* use the nearest dialog manager to display dialogs ([#2865](https://github.com/GetStream/stream-chat-react/issues/2865)) ([e4081c8](https://github.com/GetStream/stream-chat-react/commit/e4081c832649f77f1286f1d41854fb7645a923c1))

### Features

* add optional remarkIgnoreMarkdown plugin to avoid markdown transform to HTML ([#2872](https://github.com/GetStream/stream-chat-react/issues/2872)) ([33c6678](https://github.com/GetStream/stream-chat-react/commit/33c667870f9bc306a1eb6e242e0eff8725e394e3))

### Chores

* **deps:** bump axios from 1.9.0 to 1.12.2 in /examples/tutorial ([#2846](https://github.com/GetStream/stream-chat-react/issues/2846)) ([3377c24](https://github.com/GetStream/stream-chat-react/commit/3377c2458f6a3d7c7b45a9ad8c2363931ec5db1c))
* **deps:** upgrade @stream-io/stream-chat-css to v5.15.0 ([cf3ad0f](https://github.com/GetStream/stream-chat-react/commit/cf3ad0f0121916f8373f349a3bcf94b0d04731cd))
* **deps:** upgrade stream-chat to v9.25.0 ([419140c](https://github.com/GetStream/stream-chat-react/commit/419140c9fd7974333b6d430079fe472dbabffb47))

## [13.9.0](https://github.com/GetStream/stream-chat-react/compare/v13.8.1...v13.9.0) (2025-10-09)

### Features

* add optional Delete for me message action ([#2855](https://github.com/GetStream/stream-chat-react/issues/2855)) ([ade1a9c](https://github.com/GetStream/stream-chat-react/commit/ade1a9c1c409593e9d9de943c387f8a528d85033))
* support message delivered and message sent statuses separately ([#2837](https://github.com/GetStream/stream-chat-react/issues/2837)) ([008d0b0](https://github.com/GetStream/stream-chat-react/commit/008d0b0455c009855aeb62db39b48944e7873c4c))

## [13.8.1](https://github.com/GetStream/stream-chat-react/compare/v13.8.0...v13.8.1) (2025-10-08)

### Bug Fixes

* add "team" property to the `DefaultChannelData` interface ([#2850](https://github.com/GetStream/stream-chat-react/issues/2850)) ([edac5f6](https://github.com/GetStream/stream-chat-react/commit/edac5f6681bfe7e54dc055ab48e2e96074525504))

### Chores

* **deps:** upgrade steam-chat to v9.21.0 ([fad4407](https://github.com/GetStream/stream-chat-react/commit/fad4407d0103aeb173e9c72ca9a7c120e5c35826))

## [13.8.0](https://github.com/GetStream/stream-chat-react/compare/v13.7.0...v13.8.0) (2025-10-08)

### Bug Fixes

* add CustomMessageComposerData redeclaration ([#2833](https://github.com/GetStream/stream-chat-react/issues/2833)) ([641cdd3](https://github.com/GetStream/stream-chat-react/commit/641cdd346e5e4ed1ff8410f65a28c25f39aa5b58))
* add notification translator for notification validation:attachment:upload:in-progress ([#2842](https://github.com/GetStream/stream-chat-react/issues/2842)) ([7c2a965](https://github.com/GetStream/stream-chat-react/commit/7c2a965ce6664bb8f17682b277c704bcdee24ff4))
* **ChannelPreview:** call getLatestMessagePreview on every relevant WS event ([#2838](https://github.com/GetStream/stream-chat-react/issues/2838)) ([386ef55](https://github.com/GetStream/stream-chat-react/commit/386ef55b291520b6fcc9a6063d93d1a119941627))
* check cast-poll-vote permission to show "Suggest an option" poll action ([#2835](https://github.com/GetStream/stream-chat-react/issues/2835)) ([a14367e](https://github.com/GetStream/stream-chat-react/commit/a14367e0134a92326aaaa188484a09ff4e6852d0))
* **giphy:** allow using actions in quoted messages ([#2849](https://github.com/GetStream/stream-chat-react/issues/2849)) ([8052bd7](https://github.com/GetStream/stream-chat-react/commit/8052bd7fc639158eea5a2b7f9f2c4f479f5db238))
* **TextareaComposer:** check sendable data before allowing message submission ([#2852](https://github.com/GetStream/stream-chat-react/issues/2852)) ([4300ed6](https://github.com/GetStream/stream-chat-react/commit/4300ed686482ea73c532da6b0e50931c7aa76a6d))
* **useMessageComposer:** keep editing message composer with up-to-date edited message reference ([#2851](https://github.com/GetStream/stream-chat-react/issues/2851)) ([d4eb2d7](https://github.com/GetStream/stream-chat-react/commit/d4eb2d712e19e42e0828b2bad9ab15f756309580))

### Features

* allow to override EditMessageModal and thus its additionalMessageInputProps ([#2853](https://github.com/GetStream/stream-chat-react/issues/2853)) ([50e3c62](https://github.com/GetStream/stream-chat-react/commit/50e3c6253653079c393a4282c5ff20108e7eca79))

### Chores

* **deps:** upgrade stream-chat to v9.20.3 ([51ea875](https://github.com/GetStream/stream-chat-react/commit/51ea8758941208ccd6263b582e523bb97d697ec7))

## [13.7.0](https://github.com/GetStream/stream-chat-react/compare/v13.6.6...v13.7.0) (2025-09-18)

### Features

* add imageToLink Remark plugin for converting image MD links to anchor tags ([#2832](https://github.com/GetStream/stream-chat-react/issues/2832)) ([32fce17](https://github.com/GetStream/stream-chat-react/commit/32fce1760b167f94a1c2e55f8816a998a79ee8cd))
* support inserted text element in message markdown rendering ([#2831](https://github.com/GetStream/stream-chat-react/issues/2831)) ([9135112](https://github.com/GetStream/stream-chat-react/commit/9135112a73bde470988f5cbb038209f84e1f3966))

## [13.6.6](https://github.com/GetStream/stream-chat-react/compare/v13.6.5...v13.6.6) (2025-09-17)

### Bug Fixes

* enabled headings in message markdown ([#2829](https://github.com/GetStream/stream-chat-react/issues/2829)) ([1bdcb8d](https://github.com/GetStream/stream-chat-react/commit/1bdcb8d3cf44e334c999c333d419c0f51d6cf1bc))
* render html as text in ChannelPreview ([#2830](https://github.com/GetStream/stream-chat-react/issues/2830)) ([509e45f](https://github.com/GetStream/stream-chat-react/commit/509e45f34d0dde8af0a7302225306e7fbbcedf27))

## [13.6.5](https://github.com/GetStream/stream-chat-react/compare/v13.6.4...v13.6.5) (2025-09-15)

### Bug Fixes

* reflect channel config besides user permissions in AttachmentSelector ([#2824](https://github.com/GetStream/stream-chat-react/issues/2824)) ([6e0a6e6](https://github.com/GetStream/stream-chat-react/commit/6e0a6e6621abef800fd8ab522eb4a4fe7e7bbda7))

## [13.6.4](https://github.com/GetStream/stream-chat-react/compare/v13.6.3...v13.6.4) (2025-09-11)

### Bug Fixes

* display message actions dialogs for thread replies sent to channel ([#2823](https://github.com/GetStream/stream-chat-react/issues/2823)) ([04149ab](https://github.com/GetStream/stream-chat-react/commit/04149ab73d4a315282780c12ac6364c35755d85c))

## [13.6.3](https://github.com/GetStream/stream-chat-react/compare/v13.6.2...v13.6.3) (2025-09-10)

### Bug Fixes

* add missing translations for poll composer error messages ([#2820](https://github.com/GetStream/stream-chat-react/issues/2820)) ([5f814d9](https://github.com/GetStream/stream-chat-react/commit/5f814d98c93529d4a4ae5bef4524b2abae49d924))
* export LoadingChannel component ([#2818](https://github.com/GetStream/stream-chat-react/issues/2818)) ([8a01942](https://github.com/GetStream/stream-chat-react/commit/8a019429d8c78555c731a19a502452f6fbf7f8be))

## [13.6.2](https://github.com/GetStream/stream-chat-react/compare/v13.6.1...v13.6.2) (2025-09-06)

### Bug Fixes

* return possibility to compose characters ([8a932f0](https://github.com/GetStream/stream-chat-react/commit/8a932f0aa874de7084606c84833816668337177f))

## [13.6.1](https://github.com/GetStream/stream-chat-react/compare/v13.6.0...v13.6.1) (2025-09-03)

### Bug Fixes

* check the presence of remindMe and saveForLater message actions correctly ([#2808](https://github.com/GetStream/stream-chat-react/issues/2808)) ([4c1d1c3](https://github.com/GetStream/stream-chat-react/commit/4c1d1c3b2de2ae43f0f538dbd30b2ff1551c87c8))
* prevent textarea selection reset upon text insertion ([#2814](https://github.com/GetStream/stream-chat-react/issues/2814)) ([fc04d13](https://github.com/GetStream/stream-chat-react/commit/fc04d13a0103b1a2c85e0c1e0a4f9c817d45702a))

## [13.6.0](https://github.com/GetStream/stream-chat-react/compare/v13.5.1...v13.6.0) (2025-08-27)

### Features

* add support for global modal rendering at the top of the chat component tree ([#2792](https://github.com/GetStream/stream-chat-react/issues/2792)) ([0268652](https://github.com/GetStream/stream-chat-react/commit/0268652b82a5fd0b674a4fb8e4992241d2297b87))
* respect onCloseAttempt prop in GlobalModal ([#2802](https://github.com/GetStream/stream-chat-react/issues/2802)) ([d630ef1](https://github.com/GetStream/stream-chat-react/commit/d630ef1a5b016e4c195989fee41b9031df599b9c))

## [13.5.1](https://github.com/GetStream/stream-chat-react/compare/v13.5.0...v13.5.1) (2025-08-18)

### Bug Fixes

* remove optimization preventing ChannelList re-render on member.updated event ([#2801](https://github.com/GetStream/stream-chat-react/issues/2801)) ([70d39f9](https://github.com/GetStream/stream-chat-react/commit/70d39f9b7ee2d0d1173829c1aad59bae0cbc2778))

## [13.5.0](https://github.com/GetStream/stream-chat-react/compare/v13.4.0...v13.5.0) (2025-08-18)

### Features

* reflect user.messages.deleted WS event ([#2799](https://github.com/GetStream/stream-chat-react/issues/2799)) ([74263c5](https://github.com/GetStream/stream-chat-react/commit/74263c590264ed25b25130f1b7fd5bb7d8131292))

## [13.4.0](https://github.com/GetStream/stream-chat-react/compare/v13.3.0...v13.4.0) (2025-08-18)

### Bug Fixes

* export type GeolocationPreviewProps ([e518a82](https://github.com/GetStream/stream-chat-react/commit/e518a828543931ad9ab618695897a15943ba8453))
* publish notification on poll vote casting limit trespass ([#2796](https://github.com/GetStream/stream-chat-react/issues/2796)) ([f5319f6](https://github.com/GetStream/stream-chat-react/commit/f5319f656904da54137346dbd9059cb4391fee0f))
* render markdown link correctly (regression in 13.2.2) ([#2790](https://github.com/GetStream/stream-chat-react/issues/2790)) ([bd1df4a](https://github.com/GetStream/stream-chat-react/commit/bd1df4a292f4521384b9a2d13e1824a7f5e3fe16))
* reset PollComposer state on poll creation form submission ([#2795](https://github.com/GetStream/stream-chat-react/issues/2795)) ([85868a3](https://github.com/GetStream/stream-chat-react/commit/85868a35f592e8a9526fa4ad7ea4c5d49eb4d219))

### Features

* allow restrictions on modal close behavior ([#2797](https://github.com/GetStream/stream-chat-react/issues/2797)) ([157615b](https://github.com/GetStream/stream-chat-react/commit/157615b10ceda4d360fda09760a4a05ea7db5448))

### Chores

* **deps:** upgrade linkifyjs to v4.3.2 ([a8e0694](https://github.com/GetStream/stream-chat-react/commit/a8e0694a575b8aaee31e559ba1854c6b3ad07659))

## [13.3.0](https://github.com/GetStream/stream-chat-react/compare/v13.2.3...v13.3.0) (2025-07-25)

### Bug Fixes

* focus message composer textarea on suggestion item selection ([#2782](https://github.com/GetStream/stream-chat-react/issues/2782)) ([c7c1825](https://github.com/GetStream/stream-chat-react/commit/c7c18251bd3377c57944e64a3fbe817debd93333))
* prevent validating empty inputs in poll forms ([#2780](https://github.com/GetStream/stream-chat-react/issues/2780)) ([3eaa469](https://github.com/GetStream/stream-chat-react/commit/3eaa469f2352d2cfe46e2fc81d2a9587f8268846))

### Features

* add static location and live location support ([#2587](https://github.com/GetStream/stream-chat-react/issues/2587)) ([298a371](https://github.com/GetStream/stream-chat-react/commit/298a371dc6b80d579254687b41736b18ed2799ba))
* export all message components ([#2779](https://github.com/GetStream/stream-chat-react/issues/2779)) ([1d1d8ae](https://github.com/GetStream/stream-chat-react/commit/1d1d8ae50ec68fd4312b4b457a28cac6be56783a))

### Refactors

* remove outdated/invalid code from vite example App.tsx ([a2805b0](https://github.com/GetStream/stream-chat-react/commit/a2805b01cf89ed5e4991bb2281effc16b0a3fe7c))

## [13.2.3](https://github.com/GetStream/stream-chat-react/compare/v13.2.2...v13.2.3) (2025-07-15)

### Bug Fixes

* export MessageIsThreadReplyInChannelButtonIndicator ([#2774](https://github.com/GetStream/stream-chat-react/issues/2774)) ([a87f500](https://github.com/GetStream/stream-chat-react/commit/a87f500f12b836b38e9cf6cd97779cc01d3c1b29))
* regenerate image preview URL on image attachment removal when editing a message ([#2775](https://github.com/GetStream/stream-chat-react/issues/2775)) ([2c7d3ce](https://github.com/GetStream/stream-chat-react/commit/2c7d3ce80137a265e51ab1c47d1ae6e833c21843))

## [13.2.2](https://github.com/GetStream/stream-chat-react/compare/v13.2.1...v13.2.2) (2025-07-11)

### Bug Fixes

* change MultipleAnswersField input element to type text ([#2761](https://github.com/GetStream/stream-chat-react/issues/2761)) ([a590629](https://github.com/GetStream/stream-chat-react/commit/a5906297ef7273342707721cdf8d815ddb360046))
* distinguish non-submit form buttons ([#2769](https://github.com/GetStream/stream-chat-react/issues/2769)) ([bdc3c3e](https://github.com/GetStream/stream-chat-react/commit/bdc3c3e1f11fae635895308487b000b814c7de29))
* ensure all message links are properly wrapped when sharing same root domain ([#2754](https://github.com/GetStream/stream-chat-react/issues/2754)) ([adeb0e7](https://github.com/GetStream/stream-chat-react/commit/adeb0e73144755ef3d81d84dfdbbaf665c7e7d1c))
* focus textarea upon file input change event ([#2752](https://github.com/GetStream/stream-chat-react/issues/2752)) ([22e0702](https://github.com/GetStream/stream-chat-react/commit/22e0702e69ef5a69138813eb418e219d08843d3b))
* forward error object to LoadingErrorIndicator in ChannelList ([#2768](https://github.com/GetStream/stream-chat-react/issues/2768)) ([c014b1f](https://github.com/GetStream/stream-chat-react/commit/c014b1f21682b75abf9f889bfedd29b71be3be48))
* keep focused textarea when message composer state changes ([#2759](https://github.com/GetStream/stream-chat-react/issues/2759)) ([e6d5a7f](https://github.com/GetStream/stream-chat-react/commit/e6d5a7ffb411932668d2c310843e9e629340cba8))
* make character composition possible in textarea ([#2762](https://github.com/GetStream/stream-chat-react/issues/2762)) ([bbe09e5](https://github.com/GetStream/stream-chat-react/commit/bbe09e53a009655aea2dfc801c926f4a21d97cef))
* prevent querying thread draft when drafts are disabled ([#2767](https://github.com/GetStream/stream-chat-react/issues/2767)) ([ff43179](https://github.com/GetStream/stream-chat-react/commit/ff4317987ab3aeff74e03235cd3bc1d44881b4be))
* prevent setting unread UI state for channel non-members ([#2757](https://github.com/GetStream/stream-chat-react/issues/2757)) ([952612a](https://github.com/GetStream/stream-chat-react/commit/952612a7c84bddcccb083afd18874bcb3a65cd8e))

## [13.2.1](https://github.com/GetStream/stream-chat-react/compare/v13.2.0...v13.2.1) (2025-06-23)

### Chores

* **deps:** upgrade @stream-io/stream-chat-css to latest version ([#2744](https://github.com/GetStream/stream-chat-react/issues/2744)) ([8680df6](https://github.com/GetStream/stream-chat-react/commit/8680df64e3980191b0d474bec7c473dd6cae9570))

## [13.2.0](https://github.com/GetStream/stream-chat-react/compare/v13.1.2...v13.2.0) (2025-06-20)

### Bug Fixes

* prevent debouncing the selection state update in TextareaComposer ([#2741](https://github.com/GetStream/stream-chat-react/issues/2741)) ([e50d89a](https://github.com/GetStream/stream-chat-react/commit/e50d89a7bc117519d3cecc4bd37697f94ecaaeb8))

### Features

* add pagination tools to ChannelList context ([#2742](https://github.com/GetStream/stream-chat-react/issues/2742)) ([9599e9d](https://github.com/GetStream/stream-chat-react/commit/9599e9df22aea927b4109632f008ded18ffa6aeb))

### Chores

* **deps:** remove mml-react ([#2743](https://github.com/GetStream/stream-chat-react/issues/2743)) ([33e5fc9](https://github.com/GetStream/stream-chat-react/commit/33e5fc97f4639feb2d1dd3b73a5184cc7ea91c86))
* **deps:** upgrade stream-chat to v9.8.0 ([2fd6d65](https://github.com/GetStream/stream-chat-react/commit/2fd6d65788a6ba1192949df7a7fae4992d68fc24))

## [13.1.2](https://github.com/GetStream/stream-chat-react/compare/v13.1.1...v13.1.2) (2025-06-19)

### Bug Fixes

* **InfiniteScroll:** replace refs with state-based deps ([#2740](https://github.com/GetStream/stream-chat-react/issues/2740)) ([148db93](https://github.com/GetStream/stream-chat-react/commit/148db930f28ec7949eeab8935e6c3572948f8d82))

## [13.1.1](https://github.com/GetStream/stream-chat-react/compare/v13.1.0...v13.1.1) (2025-06-19)

### Bug Fixes

* allow to pre-register TranslationTopic translator functions ([#2737](https://github.com/GetStream/stream-chat-react/issues/2737)) ([1e53bed](https://github.com/GetStream/stream-chat-react/commit/1e53bedc5f767999090b05e06f3380b9033a745a))
* make MessageThreadReplyInChannelButtonIndicator to MessageIsThreadReplyInChannelButtonIndicator ([#2735](https://github.com/GetStream/stream-chat-react/issues/2735)) ([f709eb6](https://github.com/GetStream/stream-chat-react/commit/f709eb6bcab675a3fc11e66472a6eb9a1ce19502))

## [13.1.0](https://github.com/GetStream/stream-chat-react/compare/v13.0.5...v13.1.0) (2025-06-12)

### Bug Fixes

* prevent adding newline in message text composer upon submitting with Enter key ([#2729](https://github.com/GetStream/stream-chat-react/issues/2729)) ([c69e8d0](https://github.com/GetStream/stream-chat-react/commit/c69e8d0cf830beecaff676e8c61287d1818554df))
* prevent rendering placeholder for empty message list if messages are actually loaded  ([#2731](https://github.com/GetStream/stream-chat-react/issues/2731)) ([759bf44](https://github.com/GetStream/stream-chat-react/commit/759bf440c518bb26831108966628f9abaa0bc314))
* use channel_id and channel_type values from event channel.visible ([#2730](https://github.com/GetStream/stream-chat-react/issues/2730)) ([d5f743b](https://github.com/GetStream/stream-chat-react/commit/d5f743b822b304af56ab46599e76b2175e8aea45))

### Features

* add message reminders ([#2724](https://github.com/GetStream/stream-chat-react/issues/2724)) ([37264db](https://github.com/GetStream/stream-chat-react/commit/37264dbae762b8480e829ffc1d53383757fb94de))
* add translation building capability to Streami18n and useNotifications hook ([#2719](https://github.com/GetStream/stream-chat-react/issues/2719)) ([20c4889](https://github.com/GetStream/stream-chat-react/commit/20c4889d43d2e7e04825b4a978221661418fa182))
* allow to send thread reply to channel ([#2733](https://github.com/GetStream/stream-chat-react/issues/2733)) ([7fbc478](https://github.com/GetStream/stream-chat-react/commit/7fbc47890b501a42179b6a5d764d0e218689b851))

### Chores

* **deps:** remove unused dependencies prop-types and textarea-caret ([#2720](https://github.com/GetStream/stream-chat-react/issues/2720)) ([e7708fd](https://github.com/GetStream/stream-chat-react/commit/e7708fdae001b7b1a47c9e3fc2ce560f2412455c))

## [13.0.5](https://github.com/GetStream/stream-chat-react/compare/v13.0.4...v13.0.5) (2025-05-28)

### Chores

* **deps:** upgrade @stream-io/stream-chat-css to v5.9.3 ([#2722](https://github.com/GetStream/stream-chat-react/issues/2722)) ([52abc83](https://github.com/GetStream/stream-chat-react/commit/52abc835b736963808b911db4c0bd1b1abb4cd7d))

## [13.0.4](https://github.com/GetStream/stream-chat-react/compare/v13.0.3...v13.0.4) (2025-05-22)

### Bug Fixes

* extend dialogManagerId's with dictinct strings ([#2696](https://github.com/GetStream/stream-chat-react/issues/2696)) ([137c2e7](https://github.com/GetStream/stream-chat-react/commit/137c2e723c0e8c9c77c49b01788136d012e7a82b)), closes [#2685](https://github.com/GetStream/stream-chat-react/issues/2685) [#2682](https://github.com/GetStream/stream-chat-react/issues/2682)

## [13.0.3](https://github.com/GetStream/stream-chat-react/compare/v13.0.2...v13.0.3) (2025-05-22)

### Chores

* **deps:** upgrade stream-chat-css to version 5.9.2 ([b53e03d](https://github.com/GetStream/stream-chat-react/commit/b53e03d94370850e612455290e4988834ec0c6ca))

## [13.0.2](https://github.com/GetStream/stream-chat-react/compare/v13.0.1...v13.0.2) (2025-05-21)

### Bug Fixes

* account for polls with no options in PollHeader text ([#2713](https://github.com/GetStream/stream-chat-react/issues/2713)) ([4c1cff7](https://github.com/GetStream/stream-chat-react/commit/4c1cff775ab2479dd8343e58ba84339aa62a414d))
* export useAudioController hook ([#2717](https://github.com/GetStream/stream-chat-react/issues/2717)) ([8829e94](https://github.com/GetStream/stream-chat-react/commit/8829e94a3c9239f147784b9c63063facef65e10f))
* prevent page reload on FormDialog submission with Enter key ([#2715](https://github.com/GetStream/stream-chat-react/issues/2715)) ([7c7f26e](https://github.com/GetStream/stream-chat-react/commit/7c7f26ec8d10500b36653c6ee83d97d3986c856b))

## [13.0.1](https://github.com/GetStream/stream-chat-react/compare/v13.0.0...v13.0.1) (2025-05-15)

### Bug Fixes

* clear composer state optimistically with snapshot restoration upon sending a message ([#2710](https://github.com/GetStream/stream-chat-react/issues/2710)) ([b6e91a2](https://github.com/GetStream/stream-chat-react/commit/b6e91a2c6caf087e77c5d12ac67cca996b4c2e9d))
* inject error into PollComposer state if native numeric field validation fails ([#2702](https://github.com/GetStream/stream-chat-react/issues/2702)) ([8bca9f0](https://github.com/GetStream/stream-chat-react/commit/8bca9f098cc5a26409dc98a342e7180af353c3d1))
* prevent sorting poll options in place ([#2699](https://github.com/GetStream/stream-chat-react/issues/2699)) ([88590f1](https://github.com/GetStream/stream-chat-react/commit/88590f194eb4d8a0627a4ca7b8876c1166094ca0))
* reflect maxRows in TextareaComposer and allow to add lines ([#2709](https://github.com/GetStream/stream-chat-react/issues/2709)) ([990e15c](https://github.com/GetStream/stream-chat-react/commit/990e15c91d94d42e31e2479f05606c5370e408e8))
* reset message composer state partially when poll message is sent ([#2703](https://github.com/GetStream/stream-chat-react/issues/2703)) ([5708807](https://github.com/GetStream/stream-chat-react/commit/5708807fbde65950df1be3ab98f07e2ac81474f5))

## [13.0.0](https://github.com/GetStream/stream-chat-react/compare/v12.15.0...v13.0.0) (2025-05-06)

### ⚠ BREAKING CHANGES

* `Channel` props `dragAndDropWindow` &
`optionalMessageInputProps` have been removed, use
* Remove ChatAutoComplete, AutoCompleteTextarea,
DefaultSuggestionList, DefaultSuggestionListItem and introduce
TextareaComposer, SuggestionList, SuggestionListItem
* Remove defaultScrollToItem function previously used by
SuggestionList
* Removed DefaultTriggerProvider component
* Remove from Channel props - acceptedFiles,
enrichURLForPreview, enrichURLForPreviewConfig, maxNumberOfFiles,
multipleUploads, TriggerProvider
* Removal of acceptedFiles, debounceURLEnrichmentMs,
enrichURLForPreview, findURLFn, multipleUploads, onLinkPreviewDismissed,
quotedMessage from ChannelStateContext
* Changed signature for functions sendMessage and
editMessage in ChannelActionContext
* Changed signature for handleSubmit
* Removed setQuotedMessage from ChannelActionContext
* Removed types MessageToSend, StreamMessage,
UpdatedMessage in favor of LocalMessage or RenderedMessage
* Removed Trigger generics from ChannelProps
* Message input state as well as the API is now kept
within MessageComposer instead of MessageInputContext
* Renamed useMessageInputState to useMessageInputControls
as it does not handle the composition state anymore
* Removed from MessageInputProps - disabled,
disableMentions, doFileUploadRequest, doImageUploadRequest,
errorHandler, getDefaultValue, mentionAllAppUsers, mentionQueryParams,
message, noFiles, urlEnrichmentConfig, useMentionsTransliteration,
additionalTextareaProps do not expect default value anymore
* Changed the signature of MessageInput prop
overrideSubmitHandler
* Local attachment and link preview types moved to
stream-chat
* The SuggestionListItem UI components for
TextareaComposer receive tokenizedDisplayName instead of itemNameParts
* Removed duplicate types SendMessageOptions,
UpdateMessageOptions which should be imported from stream-chat instead
* Removed type LinkPreviewListProps - LinkPreviewList
does not have any props anymore
* dropped `StreamChatGenerics`, use `Custom<Entity>Data`
to extend your types

### Bug Fixes

* make consistent use of message composition related props ([#2695](https://github.com/GetStream/stream-chat-react/issues/2695)) ([2b789e5](https://github.com/GetStream/stream-chat-react/commit/2b789e5c9be4727d9ec03ce128067f6d111415be))
* replace StreamChatGenerics with module augmentation ([#2634](https://github.com/GetStream/stream-chat-react/issues/2634)) ([67bed79](https://github.com/GetStream/stream-chat-react/commit/67bed794555cd1e71456c0732c6bacfcd2712685))

### Features

* default data interfaces ([#2683](https://github.com/GetStream/stream-chat-react/issues/2683)) ([a88e145](https://github.com/GetStream/stream-chat-react/commit/a88e1456e970b6c344545422bdbc4edd1370b862))
* message composer ([#2669](https://github.com/GetStream/stream-chat-react/issues/2669)) ([fa2519b](https://github.com/GetStream/stream-chat-react/commit/fa2519b50f1a3bb8837369188bffb356509236ed)), closes [#2688](https://github.com/GetStream/stream-chat-react/issues/2688)
* replace SuggestionItem prop with suggestionItemComponents prop for SuggestionList ([#2693](https://github.com/GetStream/stream-chat-react/issues/2693)) ([985f5e3](https://github.com/GetStream/stream-chat-react/commit/985f5e3a43da660573e21dcc44f96cf4b44b3552))

### Chores

* **deps:** upgrade stream-chat to v9.0.0 ([666be5e](https://github.com/GetStream/stream-chat-react/commit/666be5e3bce201b2371de65a4e899c09deec86e3))

## [13.0.0-rc.2](https://github.com/GetStream/stream-chat-react/compare/v13.0.0-rc.1...v13.0.0-rc.2) (2025-04-30)

### Features

* replace SuggestionItem prop with suggestionItemComponents prop for SuggestionList ([#2693](https://github.com/GetStream/stream-chat-react/issues/2693)) ([985f5e3](https://github.com/GetStream/stream-chat-react/commit/985f5e3a43da660573e21dcc44f96cf4b44b3552))

## [13.0.0-rc.1](https://github.com/GetStream/stream-chat-react/compare/v12.14.0...v13.0.0-rc.1) (2025-04-28)

### ⚠ BREAKING CHANGES

* `Channel` props `dragAndDropWindow` &
`optionalMessageInputProps` have been removed, use
* Remove ChatAutoComplete, AutoCompleteTextarea,
DefaultSuggestionList, DefaultSuggestionListItem and introduce
TextareaComposer, SuggestionList, SuggestionListItem
* Remove defaultScrollToItem function previously used by
SuggestionList
* Removed DefaultTriggerProvider component
* Remove from Channel props - acceptedFiles,
enrichURLForPreview, enrichURLForPreviewConfig, maxNumberOfFiles,
multipleUploads, TriggerProvider
* Removal of acceptedFiles, debounceURLEnrichmentMs,
enrichURLForPreview, findURLFn, multipleUploads, onLinkPreviewDismissed,
quotedMessage from ChannelStateContext
* Changed signature for functions sendMessage and
editMessage in ChannelActionContext
* Changed signature for handleSubmit
* Removed setQuotedMessage from ChannelActionContext
* Removed types MessageToSend, StreamMessage,
UpdatedMessage in favor of LocalMessage or RenderedMessage
* Removed Trigger generics from ChannelProps
* Message input state as well as the API is now kept
within MessageComposer instead of MessageInputContext
* Renamed useMessageInputState to useMessageInputControls
as it does not handle the composition state anymore
* Removed from MessageInputProps - disabled,
disableMentions, doFileUploadRequest, doImageUploadRequest,
errorHandler, getDefaultValue, mentionAllAppUsers, mentionQueryParams,
message, noFiles, urlEnrichmentConfig, useMentionsTransliteration,
additionalTextareaProps do not expect default value anymore
* Changed the signature of MessageInput prop
overrideSubmitHandler
* Local attachment and link preview types moved to
stream-chat
* The SuggestionListItem UI components for
TextareaComposer receive tokenizedDisplayName instead of itemNameParts
* Removed duplicate types SendMessageOptions,
UpdateMessageOptions which should be imported from stream-chat instead
* Removed type LinkPreviewListProps - LinkPreviewList
does not have any props anymore
* dropped `StreamChatGenerics`, use `Custom<Entity>Data`
to extend your types

### Bug Fixes

* replace StreamChatGenerics with module augmentation ([#2634](https://github.com/GetStream/stream-chat-react/issues/2634)) ([67bed79](https://github.com/GetStream/stream-chat-react/commit/67bed794555cd1e71456c0732c6bacfcd2712685))

### Features

* default data interfaces ([#2683](https://github.com/GetStream/stream-chat-react/issues/2683)) ([a88e145](https://github.com/GetStream/stream-chat-react/commit/a88e1456e970b6c344545422bdbc4edd1370b862))
* introduce WithDragAndDropUpload component ([#2688](https://github.com/GetStream/stream-chat-react/issues/2688)) ([6b03abd](https://github.com/GetStream/stream-chat-react/commit/6b03abd707165d08539af435b940dd13025481d2))
* message composer ([#2669](https://github.com/GetStream/stream-chat-react/issues/2669)) ([fa2519b](https://github.com/GetStream/stream-chat-react/commit/fa2519b50f1a3bb8837369188bffb356509236ed)), closes [#2688](https://github.com/GetStream/stream-chat-react/issues/2688)

## [12.15.0](https://github.com/GetStream/stream-chat-react/compare/v12.14.0...v12.15.0) (2025-05-02)

### Features

* introduce WithDragAndDropUpload component ([#2688](https://github.com/GetStream/stream-chat-react/issues/2688)) ([6b03abd](https://github.com/GetStream/stream-chat-react/commit/6b03abd707165d08539af435b940dd13025481d2))

### Chores

* **deps:** upgrade @stream-io/stream-chat-css to v5.8.1 ([#2689](https://github.com/GetStream/stream-chat-react/issues/2689)) ([d0c32e3](https://github.com/GetStream/stream-chat-react/commit/d0c32e33225c2e72bf4f14f368c34fa3a34c543c))

### Refactors

* simplify WithDragAndDropUpload API ([#2691](https://github.com/GetStream/stream-chat-react/issues/2691)) ([46c9add](https://github.com/GetStream/stream-chat-react/commit/46c9add73d8c37ed65cd0c2808c148199820889a))

## [12.14.0](https://github.com/GetStream/stream-chat-react/compare/v12.13.1...v12.14.0) (2025-04-08)

### Features

* [REACT-218] add MessageBlocked component ([#2675](https://github.com/GetStream/stream-chat-react/issues/2675)) ([0ecd147](https://github.com/GetStream/stream-chat-react/commit/0ecd147264a57921623cf80dad0faa97db203cf3))

## [12.13.1](https://github.com/GetStream/stream-chat-react/compare/v12.13.0...v12.13.1) (2025-03-05)

### Chores

* **deps:** upgrade @stream-io/stream-chat-css to v5.7.2 ([#2660](https://github.com/GetStream/stream-chat-react/issues/2660)) ([03fad40](https://github.com/GetStream/stream-chat-react/commit/03fad407fd46a5fd1e5d930cf8e741329c0a895f))

## [12.13.0](https://github.com/GetStream/stream-chat-react/compare/v12.12.0...v12.13.0) (2025-02-19)


### Bug Fixes

* hide UnreadMessagesSeparator in threads ([#2650](https://github.com/GetStream/stream-chat-react/issues/2650)) ([e58bc2a](https://github.com/GetStream/stream-chat-react/commit/e58bc2a3defbac4fcf71a62270f9808bc5114205))


### Features

* render Markdown within quoted message components ([#2640](https://github.com/GetStream/stream-chat-react/issues/2640)) ([6674cc2](https://github.com/GetStream/stream-chat-react/commit/6674cc210fb492649042fe0092b145aadb49d154))


### Chores

* **deps:** bump react peer dependency version to v16.14.0 ([#2644](https://github.com/GetStream/stream-chat-react/issues/2644)) ([88b6dc8](https://github.com/GetStream/stream-chat-react/commit/88b6dc867a89e4ccb022ab5fc2a9c136e2e5fe6b))

## [12.12.0](https://github.com/GetStream/stream-chat-react/compare/v12.11.1...v12.12.0) (2025-02-12)


### Bug Fixes

* determine audio recording format with MediaRecorder.isTypeSupported not userAgent ([#2639](https://github.com/GetStream/stream-chat-react/issues/2639)) ([1c445de](https://github.com/GetStream/stream-chat-react/commit/1c445de211e8ed85371cf895f89e96f961e4c377))


### Features

* add general purpose search components ([#2588](https://github.com/GetStream/stream-chat-react/issues/2588)) ([d545207](https://github.com/GetStream/stream-chat-react/commit/d5452076e0fb99f44455d53fcc9f9c302f63c03f))


### Chores

* **deps:** upgrade react-markdown to v9 ([#2643](https://github.com/GetStream/stream-chat-react/issues/2643)) ([07812fe](https://github.com/GetStream/stream-chat-react/commit/07812fe15dd1dc30a060d19fe682f58d20bf8656))

## [12.11.1](https://github.com/GetStream/stream-chat-react/compare/v12.11.0...v12.11.1) (2025-02-11)


### Bug Fixes

* **handleMemberUpdated:** consider both pinned and archived channels ([#2638](https://github.com/GetStream/stream-chat-react/issues/2638)) ([ae66de8](https://github.com/GetStream/stream-chat-react/commit/ae66de8d3c5ed78fbe5aa5388ebf8a1b8e90a9e9))

## [12.11.0](https://github.com/GetStream/stream-chat-react/compare/v12.10.0...v12.11.0) (2025-02-07)


### Bug Fixes

* change useStateStore to use useSyncExternalStore ([#2573](https://github.com/GetStream/stream-chat-react/issues/2573)) ([6f2de4e](https://github.com/GetStream/stream-chat-react/commit/6f2de4ebd8e8a5b9668b44bb0204ea695c48ff01))
* make `channel.visible` respect archived and pinned channels ([#2633](https://github.com/GetStream/stream-chat-react/issues/2633)) ([2d2e2e5](https://github.com/GetStream/stream-chat-react/commit/2d2e2e56e6aff92a00d3dd2e6da8c5f7b64698e1))


### Features

* allow custom ReactionsListModal ([#2632](https://github.com/GetStream/stream-chat-react/issues/2632)) ([a428dc9](https://github.com/GetStream/stream-chat-react/commit/a428dc938388947b1f7e51fde3dd579eba76ea2f))
* allow to search for channels only ([#2625](https://github.com/GetStream/stream-chat-react/issues/2625)) ([a4d6d83](https://github.com/GetStream/stream-chat-react/commit/a4d6d83cf7c63f3284f0e0c3d0689f64ae725323))


### Chores

* **deps:** upgrade @stream-io/stream-chat-css to version 5.7.0 ([#2636](https://github.com/GetStream/stream-chat-react/issues/2636)) ([8b7cfba](https://github.com/GetStream/stream-chat-react/commit/8b7cfba7140588f5fd1d727b48b7e6c7da5d99fe))

## [12.10.0](https://github.com/GetStream/stream-chat-react/compare/v12.9.0...v12.10.0) (2025-01-28)


### Bug Fixes

* mark channel read for all incoming unread messages ([#2622](https://github.com/GetStream/stream-chat-react/issues/2622)) ([893e407](https://github.com/GetStream/stream-chat-react/commit/893e4076083ac0e79894a2d2691373c7ef667e26))


### Features

* add VirtualizedMessageListContext ([#2619](https://github.com/GetStream/stream-chat-react/issues/2619)) ([e3838d6](https://github.com/GetStream/stream-chat-react/commit/e3838d62b9c979b7c87199e4e1961f96c722fc53))

## [12.9.0](https://github.com/GetStream/stream-chat-react/compare/v12.8.2...v12.9.0) (2025-01-27)


### Bug Fixes

* channel-pinning related improvements ([#2602](https://github.com/GetStream/stream-chat-react/issues/2602)) ([9f41a4c](https://github.com/GetStream/stream-chat-react/commit/9f41a4cae12abd36690b57e111ce49994dd8b409)), closes [/github.com/GetStream/stream-chat-react/issues/2595#issuecomment-2569118691](https://github.com/GetStream//github.com/GetStream/stream-chat-react/issues/2595/issues/issuecomment-2569118691)
* import execSync ([#2616](https://github.com/GetStream/stream-chat-react/issues/2616)) ([3801375](https://github.com/GetStream/stream-chat-react/commit/38013759fbfb327acfb36ecbce0009450a93089e))


### Features

* add prop disabled to ChatAutoComplete props ([#2617](https://github.com/GetStream/stream-chat-react/issues/2617)) ([8b686fe](https://github.com/GetStream/stream-chat-react/commit/8b686fe636deeff8590bf3498b034bca5b8b2397))

## [12.8.2](https://github.com/GetStream/stream-chat-react/compare/v12.8.1...v12.8.2) (2025-01-10)


### Bug Fixes

* show unread messages indicators for target channel only ([#2597](https://github.com/GetStream/stream-chat-react/issues/2597)) ([2af5f0a](https://github.com/GetStream/stream-chat-react/commit/2af5f0a22d48ffa29ddca3eb7032f1da4dc9429a))
* show unread msg banner above unread msg only ([#2596](https://github.com/GetStream/stream-chat-react/issues/2596)) ([b9eb846](https://github.com/GetStream/stream-chat-react/commit/b9eb846f5e56d84b639fe0cf1099b1333660b000))

## [12.8.1](https://github.com/GetStream/stream-chat-react/compare/v12.8.0...v12.8.1) (2024-12-19)


### Bug Fixes

* do not clear dialog state immediately on useDialog unmount ([#2584](https://github.com/GetStream/stream-chat-react/issues/2584)) ([a8755ec](https://github.com/GetStream/stream-chat-react/commit/a8755ec8112f69dd44e95c34d176e00436cbeee5)), closes [#2583](https://github.com/GetStream/stream-chat-react/issues/2583)

## [12.8.0](https://github.com/GetStream/stream-chat-react/compare/v12.7.1...v12.8.0) (2024-12-12)


### Features

* per-user channel pinning/archiving ([#2555](https://github.com/GetStream/stream-chat-react/issues/2555)) ([a51fad0](https://github.com/GetStream/stream-chat-react/commit/a51fad067bdc0ee94fce6fff49c5085196dcc186))

## [12.7.1](https://github.com/GetStream/stream-chat-react/compare/v12.7.0...v12.7.1) (2024-12-05)


### Bug Fixes

* add support for custom resolution of whether a message is ai generated ([#2572](https://github.com/GetStream/stream-chat-react/issues/2572)) ([54640ac](https://github.com/GetStream/stream-chat-react/commit/54640ac4ec89bb3ddd73b9641d3a2ffc0d3ea924))

## [12.7.0](https://github.com/GetStream/stream-chat-react/compare/v12.6.2...v12.7.0) (2024-12-04)


### Features

* add support for ai generated messages ([#2570](https://github.com/GetStream/stream-chat-react/issues/2570)) ([fb1bfdd](https://github.com/GetStream/stream-chat-react/commit/fb1bfddd3ccfae10ef907c5c853791240fc83a35))

## [12.6.2](https://github.com/GetStream/stream-chat-react/compare/v12.6.1...v12.6.2) (2024-12-03)


### Bug Fixes

* report correct package version in esm build ([#2569](https://github.com/GetStream/stream-chat-react/issues/2569)) ([521775c](https://github.com/GetStream/stream-chat-react/commit/521775c414815f71cd7b1312d1ed0b2da27103b1))

## [12.6.1](https://github.com/GetStream/stream-chat-react/compare/v12.6.0...v12.6.1) (2024-12-02)


### Bug Fixes

* report correct package version in the source code ([#2566](https://github.com/GetStream/stream-chat-react/issues/2566)) ([2157d2f](https://github.com/GetStream/stream-chat-react/commit/2157d2f9814f88bccce2855830585d33f52f0299))

## [12.6.0](https://github.com/GetStream/stream-chat-react/compare/v12.5.2...v12.6.0) (2024-11-15)


### Features

* add group avatar ([#2556](https://github.com/GetStream/stream-chat-react/issues/2556)) ([414745d](https://github.com/GetStream/stream-chat-react/commit/414745ddd84dc35a025bf046ffa589a288aadf9b))
* support custom member data in StreamChatGenerics ([#2559](https://github.com/GetStream/stream-chat-react/issues/2559)) ([41b23db](https://github.com/GetStream/stream-chat-react/commit/41b23db9c6ae99b0a4812ca0eca7f89998a3846a))
* support moderation v2 workflow ([#2562](https://github.com/GetStream/stream-chat-react/issues/2562)) ([18afa22](https://github.com/GetStream/stream-chat-react/commit/18afa22d99ca42b6e28e2011f9b1ab6919e0e0cd))

## [12.5.2](https://github.com/GetStream/stream-chat-react/compare/v12.5.1...v12.5.2) (2024-11-11)


### Bug Fixes

* change SuggestionEmoji to extended EmojiSearchIndexResult ([#2551](https://github.com/GetStream/stream-chat-react/issues/2551)) ([658d722](https://github.com/GetStream/stream-chat-react/commit/658d7220e9e143933a19186e3f354ec4d4934442))

## [12.5.1](https://github.com/GetStream/stream-chat-react/compare/v12.5.0...v12.5.1) (2024-11-06)


### Bug Fixes

* give preference to pasting text over files ([#2552](https://github.com/GetStream/stream-chat-react/issues/2552)) ([652ae33](https://github.com/GetStream/stream-chat-react/commit/652ae337e4f707eea153f6f234d96fe1d9eb9d18))

## [12.5.0](https://github.com/GetStream/stream-chat-react/compare/v12.4.1...v12.5.0) (2024-11-01)


### Features

* add Poll support ([#2530](https://github.com/GetStream/stream-chat-react/issues/2530)) ([b4ea052](https://github.com/GetStream/stream-chat-react/commit/b4ea0528ffdeeb4daef8dfb27aaaa808ed1fc27a))

## [12.4.1](https://github.com/GetStream/stream-chat-react/compare/v12.4.0...v12.4.1) (2024-10-29)


### Bug Fixes

* remove rejected channel query promises from channel query lock ([#2549](https://github.com/GetStream/stream-chat-react/issues/2549)) ([631a928](https://github.com/GetStream/stream-chat-react/commit/631a92890b048363a1adb512de38cc1a90c4b842))

## [12.4.0](https://github.com/GetStream/stream-chat-react/compare/v12.3.0...v12.4.0) (2024-10-29)


### Features

* new MessageActions component ([#2543](https://github.com/GetStream/stream-chat-react/issues/2543)) ([17a1160](https://github.com/GetStream/stream-chat-react/commit/17a1160c8b10b2255bcb87931e3873ce33fd571c))

## [12.3.0](https://github.com/GetStream/stream-chat-react/compare/v12.2.2...v12.3.0) (2024-10-28)


### Features

* return objects from selectors instead of arrays ([#2547](https://github.com/GetStream/stream-chat-react/issues/2547)) ([ae2e22a](https://github.com/GetStream/stream-chat-react/commit/ae2e22ae918c2cf79b5598c0ae3e3562db787ebd))


### Chores

* **deps:** update stream-chat to v8.41.1 ([8369de8](https://github.com/GetStream/stream-chat-react/commit/8369de83fc2bd23529c9cb007c13935ab685f478))

## [12.2.2](https://github.com/GetStream/stream-chat-react/compare/v12.2.1...v12.2.2) (2024-10-21)


### Bug Fixes

* show dialogs in thread message list ([#2539](https://github.com/GetStream/stream-chat-react/issues/2539)) ([43895d3](https://github.com/GetStream/stream-chat-react/commit/43895d34abf1cfb4e929b2203e89939760180ed4))

## [12.2.1](https://github.com/GetStream/stream-chat-react/compare/v12.2.0...v12.2.1) (2024-10-15)


### Bug Fixes

* get correct lastMessage and latestMessagePreview from channel state ([#2535](https://github.com/GetStream/stream-chat-react/issues/2535)) ([9dcf4f3](https://github.com/GetStream/stream-chat-react/commit/9dcf4f38ecda17ff0b9efb3d3dc5d867a0f44342))

## [12.2.0](https://github.com/GetStream/stream-chat-react/compare/v12.1.0...v12.2.0) (2024-10-07)


### Bug Fixes

* add missing dependencies to ChannelList hooks effects ([#2525](https://github.com/GetStream/stream-chat-react/issues/2525)) ([9cb8e47](https://github.com/GetStream/stream-chat-react/commit/9cb8e4781482f893dc827641c8fb2b96d4fb189c))


### Features

* add openThread prop to VirtualizedMessageList ([#2523](https://github.com/GetStream/stream-chat-react/issues/2523)) ([e95eaa4](https://github.com/GetStream/stream-chat-react/commit/e95eaa4fd4686bc814f2688617d8daeac4cb4568))


### Refactors

* useScrollToBottomOnNewMessage hook ([#2532](https://github.com/GetStream/stream-chat-react/issues/2532)) ([8980016](https://github.com/GetStream/stream-chat-react/commit/8980016e430d3cf53e88efa20b19a3381ab597c3))

## [12.1.0](https://github.com/GetStream/stream-chat-react/compare/v12.0.0...v12.1.0) (2024-10-02)


### Features

* add MessageListMainPanel to ComponentContext ([#2528](https://github.com/GetStream/stream-chat-react/issues/2528)) ([32928f3](https://github.com/GetStream/stream-chat-react/commit/32928f33ad2691b565b0cedce1ef22c70008ae61))

## [12.0.0](https://github.com/GetStream/stream-chat-react/compare/v11.23.9...v12.0.0) (2024-09-17)


### ⚠ BREAKING CHANGES

* - own user will not anymore be filtered out of the selection list of users to mention if `mentionAllAppUsers` is enabled on MessageInput
* - removes the following variables from `MessageContext`: isReactionEnabled, onReactionListClick, showDetailedReactions, reactionSelectorRef
- removes prop `messageWrapperRef` from `MessageOptions` and `MessageActions` props.
* ComponentContext no longer provides any defaults
* removed Thread prop fullWidth, removed class str-chat__thread--full
* removed Window prop hideOnThread, replaced class str-chat__main-panel--hideOnThread with str-chat__main-panel--thread-open
* MP3 audio encoder has to be explicitly imported and
used as a plugin for audio recordings. The default audio recording
format is audio/wav.
* @breezystack/lamejs became a peer dependency and has to
be installed by the integrator so that the MP3 audio encoder can work
properly.
* Removed fileOrder, imageOrder, fileUploads,
imageUploads, uploadFile, uploadImage, removeFile, removeImage from the
MessageInputContext. Use attachments, uploadAttachment, uploadNewFiles, upsertAttachments, removeAttachments instead.
* Removed default values for timestamp formatting props
like calendar or format for DateSeparator, EventComponent,
MessageTimestamp. The formatting configuration now entirely relies on
i18n translations.
* The VirtualizedMessageList does not provide default
Footer component
* The VirtualizedMessageList markup has changed as
TypingIndicator is rendered as a child of MessageListMainPanel
* stylesheet import path changed & v1 stylesheet has been dropped, see release guide for more information
* theme v1 related markup and classNames have been removed
* `themeVersion` property has been removed from `ChatContext`

### Bug Fixes

* add theme to ChatView component ([#2494](https://github.com/GetStream/stream-chat-react/issues/2494)) ([d477072](https://github.com/GetStream/stream-chat-react/commit/d4770722b54f236d88bd1d0c5c207402e012ae12))
* address the circular dependencies among TranslationContext and Streami18n ([#2483](https://github.com/GetStream/stream-chat-react/issues/2483)) ([b91fd9a](https://github.com/GetStream/stream-chat-react/commit/b91fd9aa6fcdbdd9ec1fe7342c58011a0d34116d))
* change platform for CJS bundle from node to browser ([#2454](https://github.com/GetStream/stream-chat-react/issues/2454)) ([4bc2d35](https://github.com/GetStream/stream-chat-react/commit/4bc2d3591900963290d87408279dc2b516206715))
* do not rerender on client options update ([#2465](https://github.com/GetStream/stream-chat-react/issues/2465)) ([3899352](https://github.com/GetStream/stream-chat-react/commit/389935255e9d159827936f91a900d1b92573f633))
* export typeVersions correctly for emojis and mp3-encoder ([#2449](https://github.com/GetStream/stream-chat-react/issues/2449)) ([17218db](https://github.com/GetStream/stream-chat-react/commit/17218dba4fedbbfbf17bb49ec6df0271671488f4))
* extract MP3 encoder plugin ([#2447](https://github.com/GetStream/stream-chat-react/issues/2447)) ([625196f](https://github.com/GetStream/stream-chat-react/commit/625196f38fc0666f66492905584933da656afef0))
* provide both browser and node cjs bundles ([#2457](https://github.com/GetStream/stream-chat-react/issues/2457)) ([273ea2a](https://github.com/GetStream/stream-chat-react/commit/273ea2aa481c4519013e095950fed8697f1fb9f8))
* quote replies in threads ([#2487](https://github.com/GetStream/stream-chat-react/issues/2487)) ([0e4a6f1](https://github.com/GetStream/stream-chat-react/commit/0e4a6f17a53ce9ac6604c83d1d4688a8e29dc366))
* remove the use of deprecated query operator $ne ([#2504](https://github.com/GetStream/stream-chat-react/issues/2504)) ([09614f6](https://github.com/GetStream/stream-chat-react/commit/09614f688a9fbeed66584202ac5c669fd0b5c0a4))
* render typing indicator outside the VirtualizedMessageList scroll container ([#2406](https://github.com/GetStream/stream-chat-react/issues/2406)) ([d9442d2](https://github.com/GetStream/stream-chat-react/commit/d9442d2a419ee8737ac19c5663ffff04141d3650))
* reuse useChannelPreviewInfo for ThreadListItemUI ([#2508](https://github.com/GetStream/stream-chat-react/issues/2508)) ([4bb5b7c](https://github.com/GetStream/stream-chat-react/commit/4bb5b7cd0a6a49ff315b62b6b425ca89d4a08a11))
* update ChannelHeader and ChannelPreview titles and images on channel.updated ([#2500](https://github.com/GetStream/stream-chat-react/issues/2500)) ([f32fbb6](https://github.com/GetStream/stream-chat-react/commit/f32fbb6a9621e228a97c282ecdef43ef70eef075))


### Features

* add centralized dialog management ([#2489](https://github.com/GetStream/stream-chat-react/issues/2489)) ([8235d45](https://github.com/GetStream/stream-chat-react/commit/8235d45140e5ef4ffdb7f79c7c27fe5ac874f962))
* add ThreadList and ThreadProvider (Threads 2.0) ([#2407](https://github.com/GetStream/stream-chat-react/issues/2407)) ([941707d](https://github.com/GetStream/stream-chat-react/commit/941707db13db1fb28a4feae2216f71f04656f197))
* keep attachments array and remove file and image uploads in MessageInput state ([#2445](https://github.com/GetStream/stream-chat-react/issues/2445)) ([238e801](https://github.com/GetStream/stream-chat-react/commit/238e801f3ecd1997017ad56e7a24b52d81acb1a0))
* remove default timestamp formatting props from DateSeparator, EventComponent, MessageTimestamp ([#2442](https://github.com/GetStream/stream-chat-react/issues/2442)) ([6431954](https://github.com/GetStream/stream-chat-react/commit/64319549249503c0381a8834e17dd3e8befeb953))
* remove fullWidth prop from Thread & hideOnThread prop from Window ([#2450](https://github.com/GetStream/stream-chat-react/issues/2450)) ([32c8fc0](https://github.com/GetStream/stream-chat-react/commit/32c8fc08d3b6798cf0c9717200724b4b78a82e56))
* remove legacy style components ([#2394](https://github.com/GetStream/stream-chat-react/issues/2394)) ([7bf63ae](https://github.com/GetStream/stream-chat-react/commit/7bf63ae79fa6ad508407647dfec9abbc365a576f))


### Chores

* **deps:** bump @stream-io/stream-chat-css to version 5.0.0 ([9580a3f](https://github.com/GetStream/stream-chat-react/commit/9580a3f78f1b1a8e4e0037bef4035b89fb95267f))
* **deps:** bump @stream-io/stream-chat-css to version 5.0.0-rc.1nvm ([e9cf42f](https://github.com/GetStream/stream-chat-react/commit/e9cf42f242de23494267dc7187fa017fa32d3be4))
* **deps:** bump stream-chat to version 8.40.8 ([#2510](https://github.com/GetStream/stream-chat-react/issues/2510)) ([5cc7a09](https://github.com/GetStream/stream-chat-react/commit/5cc7a090a41dc1289fa07bcc039537d2816d52e0))
* **deps:** remove unused isomorphic-ws from dependencies ([853bd8b](https://github.com/GetStream/stream-chat-react/commit/853bd8bdcb61f50362c0f1183190146c5bcac103))
* **deps:** upgrade @stream-io/stream-chat-css to v5.0.0-rc.4 ([#2492](https://github.com/GetStream/stream-chat-react/issues/2492)) ([6e30cb5](https://github.com/GetStream/stream-chat-react/commit/6e30cb5300afad39ef2ff4d44b6dc69a247317e4))
* **deps:** upgrade @stream-io/stream-chat-css to v5.0.0-rc.5 ([#2495](https://github.com/GetStream/stream-chat-react/issues/2495)) ([2b8fa32](https://github.com/GetStream/stream-chat-react/commit/2b8fa3220e7875c67eebbab2e0a3430c45d60c72))

## [12.0.0-rc.15](https://github.com/GetStream/stream-chat-react/compare/v12.0.0-rc.14...v12.0.0-rc.15) (2024-09-16)


### ⚠ BREAKING CHANGES

* - own user will not anymore be filtered out of the selection list of users to mention if `mentionAllAppUsers` is enabled on MessageInput
* - removes the following variables from `MessageContext`: isReactionEnabled, onReactionListClick, showDetailedReactions, reactionSelectorRef
- removes prop `messageWrapperRef` from `MessageOptions` and `MessageActions` props.

### Bug Fixes

* remove the use of deprecated query operator $ne ([#2504](https://github.com/GetStream/stream-chat-react/issues/2504)) ([09614f6](https://github.com/GetStream/stream-chat-react/commit/09614f688a9fbeed66584202ac5c669fd0b5c0a4))
* update ChannelHeader and ChannelPreview titles and images on channel.updated ([#2500](https://github.com/GetStream/stream-chat-react/issues/2500)) ([f32fbb6](https://github.com/GetStream/stream-chat-react/commit/f32fbb6a9621e228a97c282ecdef43ef70eef075))


### Features

* add centralized dialog management ([#2489](https://github.com/GetStream/stream-chat-react/issues/2489)) ([8235d45](https://github.com/GetStream/stream-chat-react/commit/8235d45140e5ef4ffdb7f79c7c27fe5ac874f962))

## [12.0.0-rc.14](https://github.com/GetStream/stream-chat-react/compare/v12.0.0-rc.13...v12.0.0-rc.14) (2024-09-10)


### Chores

* **deps:** upgrade @stream-io/stream-chat-css to v5.0.0-rc.5 ([#2495](https://github.com/GetStream/stream-chat-react/issues/2495)) ([2b8fa32](https://github.com/GetStream/stream-chat-react/commit/2b8fa3220e7875c67eebbab2e0a3430c45d60c72))

## [12.0.0-rc.13](https://github.com/GetStream/stream-chat-react/compare/v12.0.0-rc.12...v12.0.0-rc.13) (2024-09-10)


### Bug Fixes

* add theme to ChatView component ([#2494](https://github.com/GetStream/stream-chat-react/issues/2494)) ([d477072](https://github.com/GetStream/stream-chat-react/commit/d4770722b54f236d88bd1d0c5c207402e012ae12))

## [12.0.0-rc.12](https://github.com/GetStream/stream-chat-react/compare/v12.0.0-rc.11...v12.0.0-rc.12) (2024-09-06)


### Chores

* **deps:** upgrade @stream-io/stream-chat-css to v5.0.0-rc.4 ([#2492](https://github.com/GetStream/stream-chat-react/issues/2492)) ([6e30cb5](https://github.com/GetStream/stream-chat-react/commit/6e30cb5300afad39ef2ff4d44b6dc69a247317e4))

## [12.0.0-rc.11](https://github.com/GetStream/stream-chat-react/compare/v12.0.0-rc.10...v12.0.0-rc.11) (2024-09-04)


### ⚠ BREAKING CHANGES

* ComponentContext no longer provides any defaults

### Bug Fixes

* MessageActions adjustments ([#2472](https://github.com/GetStream/stream-chat-react/issues/2472)) ([fbd1b6f](https://github.com/GetStream/stream-chat-react/commit/fbd1b6fd0843d94f250de4158b144ee65eb9bdaf))
* quote replies in threads ([#2487](https://github.com/GetStream/stream-chat-react/issues/2487)) ([0e4a6f1](https://github.com/GetStream/stream-chat-react/commit/0e4a6f17a53ce9ac6604c83d1d4688a8e29dc366))


### Features

* add ThreadList and ThreadProvider (Threads 2.0) ([#2407](https://github.com/GetStream/stream-chat-react/issues/2407)) ([941707d](https://github.com/GetStream/stream-chat-react/commit/941707db13db1fb28a4feae2216f71f04656f197))


### Chores

* **deps:** bump version of stream-chat in peerDeps ([#2481](https://github.com/GetStream/stream-chat-react/issues/2481)) ([466385d](https://github.com/GetStream/stream-chat-react/commit/466385daeb4eeb2fb22964738e533c177a5ef29f))

## [11.23.9](https://github.com/GetStream/stream-chat-react/compare/v11.23.8...v11.23.9) (2024-09-04)


* MessageActions adjustments ([#2472](https://github.com/GetStream/stream-chat-react/issues/2472)) ([fbd1b6f](https://github.com/GetStream/stream-chat-react/commit/fbd1b6fd0843d94f250de4158b144ee65eb9bdaf))

## [12.0.0-rc.10](https://github.com/GetStream/stream-chat-react/compare/v12.0.0-rc.9...v12.0.0-rc.10) (2024-08-30)


### Bug Fixes

* address the circular dependencies among TranslationContext and Streami18n ([#2483](https://github.com/GetStream/stream-chat-react/issues/2483)) ([b91fd9a](https://github.com/GetStream/stream-chat-react/commit/b91fd9aa6fcdbdd9ec1fe7342c58011a0d34116d))

## [11.23.8](https://github.com/GetStream/stream-chat-react/compare/v11.23.7...v11.23.8) (2024-08-28)


### Chores

* **deps:** bump version of stream-chat in peerDeps ([#2481](https://github.com/GetStream/stream-chat-react/issues/2481)) ([466385d](https://github.com/GetStream/stream-chat-react/commit/466385daeb4eeb2fb22964738e533c177a5ef29f))

## [12.0.0-rc.9](https://github.com/GetStream/stream-chat-react/compare/v12.0.0-rc.8...v12.0.0-rc.9) (2024-08-22)


### Bug Fixes

* use the client pagination indicators for ChannelStateContext's hasMore and hasMoreNewer flags ([#2478](https://github.com/GetStream/stream-chat-react/issues/2478)) ([eb13bd5](https://github.com/GetStream/stream-chat-react/commit/eb13bd51ec296f36f9a09edd28704ea2d22f3ed1))

## [12.0.0-rc.8](https://github.com/GetStream/stream-chat-react/compare/v12.0.0-rc.7...v12.0.0-rc.8) (2024-08-15)


### Bug Fixes

* **deps:** drop remark-gfm version ([#2471](https://github.com/GetStream/stream-chat-react/issues/2471)) ([1b359f7](https://github.com/GetStream/stream-chat-react/commit/1b359f7e4a5d4cca6edc3abbd97dee42b55c4a79))
* do not rerender on client options update ([#2465](https://github.com/GetStream/stream-chat-react/issues/2465)) ([81f33ba](https://github.com/GetStream/stream-chat-react/commit/81f33bae3933c7637e3a2a93b9c53be0511b45f6))
* do not rerender on client options update ([#2465](https://github.com/GetStream/stream-chat-react/issues/2465)) ([3899352](https://github.com/GetStream/stream-chat-react/commit/389935255e9d159827936f91a900d1b92573f633))
* downgrade react-markdown to v8 that supports React version < v18 ([#2461](https://github.com/GetStream/stream-chat-react/issues/2461)) ([5e6fea0](https://github.com/GetStream/stream-chat-react/commit/5e6fea0f6224c7266ef2eabc32c087cad81e3a8b))
* forward StreamChat constructor options via useCreateChatClient ([#2463](https://github.com/GetStream/stream-chat-react/issues/2463)) ([310835d](https://github.com/GetStream/stream-chat-react/commit/310835dc17e1228cd76d825a1dadb0f681ea552b))
* prevent ChannelPreviews with duplicate keys ([1a075ad](https://github.com/GetStream/stream-chat-react/commit/1a075ad54f834c8a205fd615207e3fde5febf8c2))
* prevent including own user in read count displayed in MessageStatus ([#2459](https://github.com/GetStream/stream-chat-react/issues/2459)) ([061d1a3](https://github.com/GetStream/stream-chat-react/commit/061d1a3eff7e029f9ce61e24206ed6497364b556))
* provide both browser and node cjs bundles ([#2457](https://github.com/GetStream/stream-chat-react/issues/2457)) ([273ea2a](https://github.com/GetStream/stream-chat-react/commit/273ea2aa481c4519013e095950fed8697f1fb9f8))


### Chores

* **deps:** remove unused isomorphic-ws from dependencies ([853bd8b](https://github.com/GetStream/stream-chat-react/commit/853bd8bdcb61f50362c0f1183190146c5bcac103))

## [12.0.0-rc.7](https://github.com/GetStream/stream-chat-react/compare/v12.0.0-rc.6...v12.0.0-rc.7) (2024-07-23)


### Bug Fixes

* change platform for CJS bundle from node to browser ([#2454](https://github.com/GetStream/stream-chat-react/issues/2454)) ([4bc2d35](https://github.com/GetStream/stream-chat-react/commit/4bc2d3591900963290d87408279dc2b516206715))

## [12.0.0-rc.6](https://github.com/GetStream/stream-chat-react/compare/v12.0.0-rc.5...v12.0.0-rc.6) (2024-07-22)


### Bug Fixes

* start audio recorder timer if already recording ([#2453](https://github.com/GetStream/stream-chat-react/issues/2453)) ([836917e](https://github.com/GetStream/stream-chat-react/commit/836917e3b231f3c1f30a98004bce367d37cf4a63))

## [12.0.0-rc.5](https://github.com/GetStream/stream-chat-react/compare/v12.0.0-rc.4...v12.0.0-rc.5) (2024-07-15)


### ⚠ BREAKING CHANGES

* removed Thread prop fullWidth, removed class str-chat__thread--full
* removed Window prop hideOnThread, replaced class str-chat__main-panel--hideOnThread with str-chat__main-panel--thread-open

### Features

* remove fullWidth prop from Thread & hideOnThread prop from Window ([#2450](https://github.com/GetStream/stream-chat-react/issues/2450)) ([32c8fc0](https://github.com/GetStream/stream-chat-react/commit/32c8fc08d3b6798cf0c9717200724b4b78a82e56))

## [12.0.0-rc.4](https://github.com/GetStream/stream-chat-react/compare/v12.0.0-rc.3...v12.0.0-rc.4) (2024-07-11)


### Bug Fixes

* export typeVersions correctly for emojis and mp3-encoder ([#2449](https://github.com/GetStream/stream-chat-react/issues/2449)) ([17218db](https://github.com/GetStream/stream-chat-react/commit/17218dba4fedbbfbf17bb49ec6df0271671488f4))

## [12.0.0-rc.3](https://github.com/GetStream/stream-chat-react/compare/v12.0.0-rc.2...v12.0.0-rc.3) (2024-07-10)


### ⚠ BREAKING CHANGES

* MP3 audio encoder has to be explicitly imported and
used as a plugin for audio recordings. The default audio recording
format is audio/wav.
* @breezystack/lamejs became a peer dependency and has to
be installed by the integrator so that the MP3 audio encoder can work
properly.
* Removed fileOrder, imageOrder, fileUploads,
imageUploads, uploadFile, uploadImage, removeFile, removeImage from the
MessageInputContext. Use attachments, uploadAttachment, uploadNewFiles, upsertAttachments, removeAttachments instead.
* Removed default values for timestamp formatting props
like calendar or format for DateSeparator, EventComponent,
MessageTimestamp. The formatting configuration now entirely relies on
i18n translations.

### Bug Fixes

* acknowledge the use of LAME ([dbce6dc](https://github.com/GetStream/stream-chat-react/commit/dbce6dc551d182d9975f17006ea08ff1ca38f4ff))
* extract MP3 encoder plugin ([#2447](https://github.com/GetStream/stream-chat-react/issues/2447)) ([625196f](https://github.com/GetStream/stream-chat-react/commit/625196f38fc0666f66492905584933da656afef0))
* reflect Message groupStyles prop in the component memoization ([#2448](https://github.com/GetStream/stream-chat-react/issues/2448)) ([251eb08](https://github.com/GetStream/stream-chat-react/commit/251eb08a637b32851b50795db2505c75fd6ece19))


### Features

* keep attachments array and remove file and image uploads in MessageInput state ([#2445](https://github.com/GetStream/stream-chat-react/issues/2445)) ([238e801](https://github.com/GetStream/stream-chat-react/commit/238e801f3ecd1997017ad56e7a24b52d81acb1a0))
* remove default timestamp formatting props from DateSeparator, EventComponent, MessageTimestamp ([#2442](https://github.com/GetStream/stream-chat-react/issues/2442)) ([6431954](https://github.com/GetStream/stream-chat-react/commit/64319549249503c0381a8834e17dd3e8befeb953))

## [12.0.0-rc.2](https://github.com/GetStream/stream-chat-react/compare/v12.0.0-rc.1...v12.0.0-rc.2) (2024-06-21)


### Chores

* **deps:** bump @stream-io/stream-chat-css to version 5.0.0-rc.1nvm ([fd27c74](https://github.com/GetStream/stream-chat-react/commit/fd27c74c14d8571bbf97b3b8eee52540e30500c4))

## [12.0.0-rc.1](https://github.com/GetStream/stream-chat-react/compare/v11.21.0...v12.0.0-rc.1) (2024-06-17)


### ⚠ BREAKING CHANGES

* The VirtualizedMessageList does not provide default
Footer component
* The VirtualizedMessageList markup has changed as
TypingIndicator is rendered as a child of MessageListMainPanel
* stylesheet import path changed & v1 stylesheet has been dropped, see release guide for more information
* theme v1 related markup and classNames have been removed
* `themeVersion` property has been removed from `ChatContext`

### Bug Fixes

* render typing indicator outside the VirtualizedMessageList scroll container ([#2406](https://github.com/GetStream/stream-chat-react/issues/2406)) ([fcaafb6](https://github.com/GetStream/stream-chat-react/commit/fcaafb6a1d41249b904350f9ccdb6527d7e881e5))


### Features

* remove legacy style components ([#2394](https://github.com/GetStream/stream-chat-react/issues/2394)) ([9410153](https://github.com/GetStream/stream-chat-react/commit/94101535d1de9de23a1ab8913423af0e7009bab9))

## [11.23.7](https://github.com/GetStream/stream-chat-react/compare/v11.23.6...v11.23.7) (2024-08-22)


### Bug Fixes

* use the client pagination indicators for ChannelStateContext's hasMore and hasMoreNewer flags ([#2478](https://github.com/GetStream/stream-chat-react/issues/2478)) ([eb13bd5](https://github.com/GetStream/stream-chat-react/commit/eb13bd51ec296f36f9a09edd28704ea2d22f3ed1))

## [11.23.6](https://github.com/GetStream/stream-chat-react/compare/v11.23.5...v11.23.6) (2024-08-15)


### Bug Fixes

* **deps:** drop remark-gfm version ([#2471](https://github.com/GetStream/stream-chat-react/issues/2471)) ([1b359f7](https://github.com/GetStream/stream-chat-react/commit/1b359f7e4a5d4cca6edc3abbd97dee42b55c4a79))

## [11.23.5](https://github.com/GetStream/stream-chat-react/compare/v11.23.4...v11.23.5) (2024-08-08)


### Bug Fixes

* do not rerender on client options update ([#2465](https://github.com/GetStream/stream-chat-react/issues/2465)) ([81f33ba](https://github.com/GetStream/stream-chat-react/commit/81f33bae3933c7637e3a2a93b9c53be0511b45f6))
* forward StreamChat constructor options via useCreateChatClient ([#2463](https://github.com/GetStream/stream-chat-react/issues/2463)) ([310835d](https://github.com/GetStream/stream-chat-react/commit/310835dc17e1228cd76d825a1dadb0f681ea552b))
* prevent ChannelPreviews with duplicate keys ([1a075ad](https://github.com/GetStream/stream-chat-react/commit/1a075ad54f834c8a205fd615207e3fde5febf8c2))

## [11.23.4](https://github.com/GetStream/stream-chat-react/compare/v11.23.3...v11.23.4) (2024-08-05)


### Bug Fixes

* downgrade react-markdown to v8 that supports React version < v18 ([#2461](https://github.com/GetStream/stream-chat-react/issues/2461)) ([5e6fea0](https://github.com/GetStream/stream-chat-react/commit/5e6fea0f6224c7266ef2eabc32c087cad81e3a8b))
* prevent including own user in read count displayed in MessageStatus ([#2459](https://github.com/GetStream/stream-chat-react/issues/2459)) ([061d1a3](https://github.com/GetStream/stream-chat-react/commit/061d1a3eff7e029f9ce61e24206ed6497364b556))

## [11.23.3](https://github.com/GetStream/stream-chat-react/compare/v11.23.2...v11.23.3) (2024-07-22)


### Bug Fixes

* start audio recorder timer if already recording ([#2453](https://github.com/GetStream/stream-chat-react/issues/2453)) ([836917e](https://github.com/GetStream/stream-chat-react/commit/836917e3b231f3c1f30a98004bce367d37cf4a63))

## [11.23.2](https://github.com/GetStream/stream-chat-react/compare/v11.23.1...v11.23.2) (2024-07-10)


### Bug Fixes

* reflect Message groupStyles prop in the component memoization ([#2448](https://github.com/GetStream/stream-chat-react/issues/2448)) ([251eb08](https://github.com/GetStream/stream-chat-react/commit/251eb08a637b32851b50795db2505c75fd6ece19))

## [11.23.1](https://github.com/GetStream/stream-chat-react/compare/v11.23.0...v11.23.1) (2024-07-08)


### Bug Fixes

* acknowledge the use of LAME ([dbce6dc](https://github.com/GetStream/stream-chat-react/commit/dbce6dc551d182d9975f17006ea08ff1ca38f4ff))

## [11.23.0](https://github.com/GetStream/stream-chat-react/compare/v11.22.0...v11.23.0) (2024-06-28)


### Bug Fixes

* adapt audio recording wave form to the available space ([#2435](https://github.com/GetStream/stream-chat-react/issues/2435)) ([aed0360](https://github.com/GetStream/stream-chat-react/commit/aed03606304f7464eae826a9cf34aee846e2162d))
* always load thread replies on Thread opening ([#2436](https://github.com/GetStream/stream-chat-react/issues/2436)) ([579953c](https://github.com/GetStream/stream-chat-react/commit/579953c167e5fb90120db1d39b73af83c980030a))
* forward groupStyles to Message in VirtualizedMessageList ([#2440](https://github.com/GetStream/stream-chat-react/issues/2440)) ([241f5d7](https://github.com/GetStream/stream-chat-react/commit/241f5d72a4c9881e766a01fd7848ca9d1c9df952))
* reflect correctly the translation key in Timestamp component ([741e9ce](https://github.com/GetStream/stream-chat-react/commit/741e9ce87f552a4d4473821012d9231628ea82de))


### Features

* configure message group size by max time between messages ([#2439](https://github.com/GetStream/stream-chat-react/issues/2439)) ([0d094cb](https://github.com/GetStream/stream-chat-react/commit/0d094cb989e75f7405e4661e42f8fd52fb35e379))

## [11.22.0](https://github.com/GetStream/stream-chat-react/compare/v11.21.0...v11.22.0) (2024-06-21)


### Bug Fixes

* adjust ChannelActionContextValue type ([#2434](https://github.com/GetStream/stream-chat-react/issues/2434)) ([977ec39](https://github.com/GetStream/stream-chat-react/commit/977ec392bef7ce310f6efb13a9c900adcd53ff86))
* avoid eager channel pagination on channel open ([#2425](https://github.com/GetStream/stream-chat-react/issues/2425)) ([c1e8b93](https://github.com/GetStream/stream-chat-react/commit/c1e8b9388f6c0b4db4a854b91e167e1e45a658a0))
* keep line breaks in message text that contains multiple markdown elements ([#2429](https://github.com/GetStream/stream-chat-react/issues/2429)) ([11e606f](https://github.com/GetStream/stream-chat-react/commit/11e606fbcdd7f03766445b398d6acd1133f34119))


### Features

* load lazily mp3 encoding library for audio recorder ([#2432](https://github.com/GetStream/stream-chat-react/issues/2432)) ([2ca3188](https://github.com/GetStream/stream-chat-react/commit/2ca318878de2f22751319b2b7ccac84644583173))

## [11.21.0](https://github.com/GetStream/stream-chat-react/compare/v11.20.0...v11.21.0) (2024-06-14)


### Bug Fixes

* allow to pass minRows prop to MessageInput ([#2411](https://github.com/GetStream/stream-chat-react/issues/2411)) ([e6bfd40](https://github.com/GetStream/stream-chat-react/commit/e6bfd40ce8a134070355865ab2829b24450d869a))
* memoize addNotification function provided by Channel component ([#2423](https://github.com/GetStream/stream-chat-react/issues/2423)) ([b3734a4](https://github.com/GetStream/stream-chat-react/commit/b3734a4a9d3c5a64c794604a92ccb4369663cee7))


### Features

* allow to configure date and time format over i18n ([#2419](https://github.com/GetStream/stream-chat-react/issues/2419)) ([cb09dc1](https://github.com/GetStream/stream-chat-react/commit/cb09dc168f5b41a3e09f38134e34c5ae5bc45cbc))

## [11.20.0](https://github.com/GetStream/stream-chat-react/compare/v11.19.0...v11.20.0) (2024-06-07)


### Bug Fixes

* make it possible to jump to system messages in MessageList ([#2404](https://github.com/GetStream/stream-chat-react/issues/2404)) ([6cb81c5](https://github.com/GetStream/stream-chat-react/commit/6cb81c544c0d134c4b1e754b362976e6d3f78ce0))
* reflect separateGiphyPreview prop value in VirtualizedMessageList ([#2402](https://github.com/GetStream/stream-chat-react/issues/2402)) ([5d00b56](https://github.com/GetStream/stream-chat-react/commit/5d00b5679eaa0212d18855009ec471e4fd611b1d))
* update quoting message on update of quoted message ([#2408](https://github.com/GetStream/stream-chat-react/issues/2408)) ([4ec3518](https://github.com/GetStream/stream-chat-react/commit/4ec3518eb8a1598d04de57450f8eb580f0d52feb))


### Features

* allow custom class on Modal root div ([#2410](https://github.com/GetStream/stream-chat-react/issues/2410)) ([b614eff](https://github.com/GetStream/stream-chat-react/commit/b614eff37171458fc2dddb36cb81595c7c8f1490))
* allow to customize MessageStatus UI by message delivery status ([#2405](https://github.com/GetStream/stream-chat-react/issues/2405)) ([7929bc2](https://github.com/GetStream/stream-chat-react/commit/7929bc29432c92ba9e31a87b16b3912bc23a99c4))
* memoize & add highlightDuration parameter to jumpTo[FirstUnread]Message ([#2414](https://github.com/GetStream/stream-chat-react/issues/2414)) ([305d4f3](https://github.com/GetStream/stream-chat-react/commit/305d4f36d91d84c95b66584634c83e4cf4e2e797))


### Chores

* **deps:** bump stream-chat to v8.33.1 ([ded8f05](https://github.com/GetStream/stream-chat-react/commit/ded8f05ef1df2fcbd3e1b5fbb731c8a986a039a0))

## [11.19.0](https://github.com/GetStream/stream-chat-react/compare/v11.18.1...v11.19.0) (2024-05-23)


### Bug Fixes

* fix aria label translations for Portuguese ([28b6dfd](https://github.com/GetStream/stream-chat-react/commit/28b6dfdd028ce1b53707d4fba8495b5722900c75))
* prevent loading more non-existent thread replies ([#2399](https://github.com/GetStream/stream-chat-react/issues/2399)) ([f2ed479](https://github.com/GetStream/stream-chat-react/commit/f2ed47938d9a042d041198690ac65a3b3f0a934a))
* prevent showing link previews in AttachmentPreviewList ([#2398](https://github.com/GetStream/stream-chat-react/issues/2398)) ([cf24894](https://github.com/GetStream/stream-chat-react/commit/cf24894f1743ebfb831dcdc2c802164f5807a9a6))


### Features

* adopt new queryReactions endpoint ([#2388](https://github.com/GetStream/stream-chat-react/issues/2388)) ([d6ca4ef](https://github.com/GetStream/stream-chat-react/commit/d6ca4effd48272921407100b5c75dfc9dc1961d4))

## [11.18.1](https://github.com/GetStream/stream-chat-react/compare/v11.18.0...v11.18.1) (2024-05-10)


### Chores

* **deps:** bump @stream-io/stream-chat-css to v4.16.1 ([d5d5ffa](https://github.com/GetStream/stream-chat-react/commit/d5d5ffa73e67dc397ff66f8901296ecf768f0918))

## [11.18.0](https://github.com/GetStream/stream-chat-react/compare/v11.17.0...v11.18.0) (2024-05-09)


### Bug Fixes

* attach class str-chat__message-with-thread-link only if the message has replies ([#2386](https://github.com/GetStream/stream-chat-react/issues/2386)) ([c71f94e](https://github.com/GetStream/stream-chat-react/commit/c71f94e81ad2db4c26c3cfbac1b9246050dc60c9))


### Features

* allow custom attachments ([#2383](https://github.com/GetStream/stream-chat-react/issues/2383)) ([c751670](https://github.com/GetStream/stream-chat-react/commit/c751670319bd40784dd2ab56e1e0ff392f9ed79f))

## [11.17.0](https://github.com/GetStream/stream-chat-react/compare/v11.16.1...v11.17.0) (2024-05-02)


### Features

* allow to review message processing before rendering in message lists ([#2375](https://github.com/GetStream/stream-chat-react/issues/2375)) ([567bea9](https://github.com/GetStream/stream-chat-react/commit/567bea9fbc90c3a9cf93682671c8025fb1f7f5a1))

## [11.16.1](https://github.com/GetStream/stream-chat-react/compare/v11.16.0...v11.16.1) (2024-05-01)


### Bug Fixes

* message input not preventing default on enter on React 16 ([#2380](https://github.com/GetStream/stream-chat-react/issues/2380)) ([ca6761f](https://github.com/GetStream/stream-chat-react/commit/ca6761f1dff8070e07702d3eb5216d18242cd662)), closes [/github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/hooks/useSubmitHandler.ts#L119](https://github.com/GetStream//github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/hooks/useSubmitHandler.ts/issues/L119)

## [11.16.0](https://github.com/GetStream/stream-chat-react/compare/v11.15.2...v11.16.0) (2024-05-01)


### Features

* support reaction groups ([#2370](https://github.com/GetStream/stream-chat-react/issues/2370)) ([560df58](https://github.com/GetStream/stream-chat-react/commit/560df589c983dc4007fe4fbe0e2740225d6f4db6))

## [11.15.2](https://github.com/GetStream/stream-chat-react/compare/v11.15.1...v11.15.2) (2024-04-24)


### Bug Fixes

* **EmojiPicker:** check whether clicked target is child of shadow root node ([#2369](https://github.com/GetStream/stream-chat-react/issues/2369)) ([c552e2c](https://github.com/GetStream/stream-chat-react/commit/c552e2c7ce7be935826d9621b50777f4712351e1))

## [11.15.1](https://github.com/GetStream/stream-chat-react/compare/v11.15.0...v11.15.1) (2024-04-18)


### Chores

* **deps:** bump @stream-io/stream-chat-css to 4.14.0 ([00aab69](https://github.com/GetStream/stream-chat-react/commit/00aab69d62b10660def5d45d5701b6326662f54a))

## [11.15.0](https://github.com/GetStream/stream-chat-react/compare/v11.14.0...v11.15.0) (2024-04-17)


### Bug Fixes

* make setChannels prop optional for ChannelSearch ([#2358](https://github.com/GetStream/stream-chat-react/issues/2358)) ([2ad6132](https://github.com/GetStream/stream-chat-react/commit/2ad613216f0bf965b7c0858d112704053f06a852))
* search results list props ([#2359](https://github.com/GetStream/stream-chat-react/issues/2359)) ([6575d30](https://github.com/GetStream/stream-chat-react/commit/6575d30d889abc16e44d9b635ccba28f793d5652))


### Features

* async voice messages recording ([#2339](https://github.com/GetStream/stream-chat-react/issues/2339)) ([b81ab96](https://github.com/GetStream/stream-chat-react/commit/b81ab964ae8705d492a4c819a044d09d404002db))

## [11.14.0](https://github.com/GetStream/stream-chat-react/compare/v11.13.1...v11.14.0) (2024-04-08)


### Bug Fixes

* add missing PinIndicator placeholder ([#2352](https://github.com/GetStream/stream-chat-react/issues/2352)) ([e059af8](https://github.com/GetStream/stream-chat-react/commit/e059af8dbd2fd6d00a390d3f071b0525e47869f9))
* file size formatting ([#2357](https://github.com/GetStream/stream-chat-react/issues/2357)) ([7e98a85](https://github.com/GetStream/stream-chat-react/commit/7e98a85efe60f84241aae316bc16453aca9c2ba9)), closes [#2301](https://github.com/GetStream/stream-chat-react/issues/2301)


### Features

* support size_limit in upload config ([#2301](https://github.com/GetStream/stream-chat-react/issues/2301)) ([a8aa524](https://github.com/GetStream/stream-chat-react/commit/a8aa524858b002f837b9859a916948141b97c67e))

## [11.13.1](https://github.com/GetStream/stream-chat-react/compare/v11.13.0...v11.13.1) (2024-04-02)


### Chores

* **deps:** drop @react-aria/focus version ([#2350](https://github.com/GetStream/stream-chat-react/issues/2350)) ([c3807d5](https://github.com/GetStream/stream-chat-react/commit/c3807d52b338c65285008c27b96e3d9c327d7c92))

## [11.13.0](https://github.com/GetStream/stream-chat-react/compare/v11.12.2...v11.13.0) (2024-03-29)


### Bug Fixes

* suggestion onClickHandler type ([#2343](https://github.com/GetStream/stream-chat-react/issues/2343)) ([1ff586a](https://github.com/GetStream/stream-chat-react/commit/1ff586adbe4b50c5de02f6f78f02f3c41b8f7c31))


### Features

* allow EmojiPicker to be closed on emoji click ([#2336](https://github.com/GetStream/stream-chat-react/issues/2336)) ([87bf84c](https://github.com/GetStream/stream-chat-react/commit/87bf84c3219807e1a21e700d8033b43c10abfa4a))

## [11.12.2](https://github.com/GetStream/stream-chat-react/compare/v11.12.1...v11.12.2) (2024-03-19)


### Bug Fixes

* jump to first unread message when the last read and first unread message id is unknown ([#2315](https://github.com/GetStream/stream-chat-react/issues/2315)) ([d40ab64](https://github.com/GetStream/stream-chat-react/commit/d40ab646a18bbd90f78a66623f0cf6c433e30e1a))
* mark retryable duplicated messages as received ([#2331](https://github.com/GetStream/stream-chat-react/issues/2331)) ([e098ef1](https://github.com/GetStream/stream-chat-react/commit/e098ef1f3682f5c19ae111305575bd2c896a60b9))

## [11.12.1](https://github.com/GetStream/stream-chat-react/compare/v11.12.0...v11.12.1) (2024-03-19)


### Bug Fixes

* await word replace before submitting message ([#2332](https://github.com/GetStream/stream-chat-react/issues/2332)) ([f396a81](https://github.com/GetStream/stream-chat-react/commit/f396a814723a49fdc4b828ea62354946f6815a86))
* link-breaking typos ([#2322](https://github.com/GetStream/stream-chat-react/issues/2322)) ([17f6b0d](https://github.com/GetStream/stream-chat-react/commit/17f6b0d6bc4f81e1e8272481ce3cd7da1c58ecba))

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
