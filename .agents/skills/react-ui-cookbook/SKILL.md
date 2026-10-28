---
name: react-ui-cookbook
description:
  Write, port or update a recipe for the React v15 docs' UI Cookbooks group, with its code in
  examples/cookbook and its screenshots taken from that app. Use whenever a task adds or changes a
  UI Cookbook recipe, its CSS, its screenshots, the cookbook base app or its demo data, so every
  recipe keeps the same look, cast and style rules.
---

# React UI Cookbook

Every UI Cookbook recipe in the React v15 docs (getstream.io, `content/docs/chat-sdk/react/v15-rc/`,
URLs under `/chat/docs/sdk/react/v15/ui-cookbooks/`) is built on one base app, follows one set of
style rules, and is shot in one frame with one cast. The runnable code lives here, in
`examples/cookbook`; the docs page shows that same code.

## The look

- **Theme:** the SDK's default theme, light, with its default font: the base app loads no theme
  of its own, and no recipe changes the theme's colors or font. A recipe's CSS reads the
  `--str-chat__*` tokens, so it follows whatever theme an app sets. Only the Theming recipe
  (`src/recipes/theming/brand-theme-and-dark-mode/`, shown on the UI › Customizing › Theming docs
  page) loads a theme, from its own variants: `theme.css`, a green brand theme in light and dark
  (an emerald accent, `#047857`, on green-tinted surfaces, solid green own bubbles, `#1a7f5a`,
  with white text, links and mentions, rounder bubbles and cards, Plus Jakarta Sans and soft
  green-tinted shadows), with every text at 4.5:1 and every border and icon at 3:1. Change the
  green theme only there. Recipes are shot in the light theme; only the Theming recipe adds dark
  shots.
- **Frame:** desktop 1280×720 at DPR 1 (`ChatView`: channel list 320px on the left, the open
  channel in the middle, a thread on the right when the recipe needs one). Phone recipes use
  390×844. A shot with four columns (the channel list, the channel, a thread and the side panel)
  uses 1600×720, set with `viewport` in `shots.json`, so the messages don't wrap word by word.
  Crop each shot to the part the recipe changes, with a little surrounding UI.
- **Side panel:** a recipe that shows content in a panel (details, a profile, info) opens it in the
  base app's one side panel (`src/base/SidePanel.tsx`), never in a column of its own: call
  `useSidePanel().openSidePanel({ id, title, body })`, or `openUserProfile(userId)` for a profile
  (the SDK's `userProfile` kind). The panel draws the title row and the close button; the recipe
  writes only the body, and its section headings use `.cookbook-side-panel__section-title`. It
  never closes the thread, and opening another panel replaces it: other content and closing
  release the whole slot, so an earlier profile never comes back. The panel moves focus to its
  title on open and gives it back to the opener on close; a recipe adds no focus code of its own.
  A recipe that only changes the message lists or the profile body sets `RecipeConfig.MessageList`
  and `RecipeConfig.sidePanelProps` instead of copying the channels view. The Overview shows its
  code. Likewise, a recipe that adds a view beside the channels view sets `RecipeConfig.views` and
  `RecipeConfig.layouts`, which the base app merges into its own.
- **Cast:** the user is Cleo; the others are Bob, Cara and Dan, with initials avatars and no
  photos. Channels: Design review, Weekend trip, Book club, Garden plot, General, and a direct
  message with Bob. All of it, with fixed message ids, is in `src/base/demo-data.json`.
- **Content:** neutral and friendly. The demo app is public: no real names, no personal data, no
  brand names.
- **Read-only:** the base app blocks every request that would change the demo app (sending,
  editing, deleting, reacting, flagging, pinning, adding members, updating channels); a blocked
  request never settles, so the UI keeps its optimistic state. Reads, watching, typing and the
  user's read state still go through (`src/base/readOnly.ts`). Data changes go in the seed, never
  in a recipe or a screenshot helper. `?writes=on` turns the guard off, for an app of your own.

## Style rules

`yarn workspace @stream-io/stream-chat-react-cookbook check:css` checks them: literal colors and
sizes, `var()`s of anything but `--str-chat__` tokens, CSS outside the layer, the prefix, and
layout properties on SDK markup. It can't judge whether a token fits; review that by eye.

1. **Tokens only.** Colors, spacing, radii and type come from `--str-chat__*` semantic tokens:
   `--str-chat__text-secondary`, `--str-chat__spacing-sm`, `--str-chat__radius-md`,
   `--str-chat__font-caption-default`, … No hex, `rgb()` or named colors, and no `px`/`rem`/`em`
   for spacing, radius or type. Border widths and component sizes may use `px`.
2. **One layer.** All recipe CSS sits inside `@layer stream-overrides { … }`. The base app declares
   the order (`modern-normalize, stream, cookbook-base, stream-overrides`), so a recipe never needs
   extra specificity or `!important`.
3. **One prefix.** Classes a recipe adds start with `.cookbook-`, followed by a name for the part it
   styles, for example `.cookbook-pinned-by` or `.cookbook-channel-header__title`. SDK classes
   (`.str-chat…`) may be restyled.
4. **Leave the SDK's layout alone.** Never set `display`, `position`, `flex`, `grid`, `float` or
   offsets on a rule whose target is an SDK class. Style your own markup, or change sizes through a
   component variable such as `--str-chat__channel-list-width`. Where the SDK has no variable, a
   comment starting `cookbook-allow-layout:` right above the rule says why; known case: the width of
   a thread beside a channel.

## Where things are

```
examples/cookbook/
  src/base/              the base app (BaseApp.tsx), its CSS (base.css), client, demo data,
                         the side panel (SidePanel.tsx), URL helpers (OpenFromUrl:
                         ?channel=&thread=; Simulate: ?simulate=typing&as=), and useClickInTurn
                         for screenshot helpers that click through the UI
  src/recipes/<group>/<recipe>/
    *.tsx, *.css         exactly the recipe code the docs page shows
    <variant>.recipe.tsx default-exports a RecipeConfig: what the recipe changes in the base app
                         (ChannelHeader, Wrapper, MessageList, sidePanelProps, views and
                         layouts merged into the base ones, chatViewProps, chatViewChildren,
                         chatProps, openFromUrl, theme), and imports the recipe's CSS
    shots.json           the screenshots the docs page uses (format in scripts/shots.mjs)
    demo-data.json       optional: users and channels only this recipe needs, in the shape of
                         src/base/demo-data.json; seeded and listed with the base data
  scripts/seed.mjs       creates or brings back in line the cast, channels, members, messages,
                         replies and pins; sets a message's attachments, mentions and custom
                         fields after sending it; sets read state and receipts, invites, and
                         the current user's pinned and archived channels, reminders, saved
                         messages and drafts (fields below)
  scripts/shots.mjs      takes every shot from the running app, writes them to --out
  scripts/check-css.mjs  the style-rule check
```

`<group>` and `<recipe>` match the docs URL: `/ui-cookbooks/headers/channel-header/` lives in
`src/recipes/headers/channel-header/`. A page with two solutions has two variants, for example
`css.recipe.tsx` and `component.recipe.tsx`. Open a recipe at
`http://localhost:5176/?recipe=<group>/<recipe>&variant=<variant>`; `?recipe=base` is the base app
alone, and no parameter lists every recipe.

## Adding or changing a recipe

1. Read the recipe's docs page and the pages it links to. Check every API it uses against
   `stream-chat-react` `master` and `stream-chat` `release-v10`.
2. Write the code in `src/recipes/<group>/<recipe>/`, following the style rules, and add a
   `<variant>.recipe.tsx` for each solution the page shows.
3. Put demo data only this recipe needs in its folder's `demo-data.json` (new ids, never reuse
   one); change `src/base/demo-data.json` only for data every recipe shares. A message may carry
   `attachments` (for example image URLs), which the seed sets after sending, since the demo app
   refuses uploads. A message may also carry `mentions` (user ids), which the seed sets after
   sending, since the demo app refuses a new message with mentions. A message may carry
   `reminderForCurrentUser`: `{}` saves it for later, `{ "remindAt": "<ISO time>" }` sets a fixed
   time, and `{ "remindAt": "+2m" }` a time that many minutes after the first seed, kept on later
   runs, which is how a reminder becomes overdue (the server refuses a past time). The demo app's
   `messaging` type has `user_message_reminders` off, so the seed reports that and skips them.
   A channel may carry `draftsForCurrentUser`, the current user's unsent drafts in it:
   `{ "text" }` for the channel's draft, with `"parent"` (a main-list message id) for a thread's
   draft and `"quotedMessage"` (a message id) for one that quotes a message. Each is saved only
   when the stored draft differs. A draft in a base channel would show in that channel's composer
   in every recipe, so drafts go in the recipe's own channels.

   The other fields the seed reads, each set only when the stored state differs:
   - On a channel: `createdBy` (a cast id that creates it instead of the current user),
     `invites` (user ids left with a pending invite), `readBy` and `deliveredTo` (members who
     read or received its last message), `readUpTo` (`{ userId: messageId }`), `unreadFrom` (a
     message id the current user's unread state starts at), and `pinnedForCurrentUser` /
     `archivedForCurrentUser`.
   - On a message: `pinnedBy` (its author), `custom` (custom fields, such as
     `{ "ai_generated": true }`), and `unreadForCurrentUser` on a thread's parent (its latest
     reply stays unread).

   Then run `seed`.
4. List the shots in `shots.json`, reusing the file names the page already references.
5. Run the checks and the shots (below), then look at every image.
6. Copy the code into the docs page so it matches the folder exactly, formatted with the docs'
   prettier (double quotes, width 80), apart from the base app's setup, which the page either
   shows in full or links to on the UI Cookbooks Overview. Two rewrites are allowed: imports of
   the shared side panel and the New conversation dialog become `./SidePanel` and
   `./NewConversationDialog`, and the `cookbook-allow-layout:` prefix is dropped from comments.
7. In getstream.io, copy the images into `content/docs/chat-sdk/react/v15-rc/_assets/` and run the
   docs checks.

## The docs page

Every recipe page has the same shape:

1. What it builds: a one- or two-sentence intro, then the features in a note: `<Admonition
   type="note">` that opens with the bold line **What you'll build**, then one short bullet per
   feature: what the user gets, never how it's done (the steps cover that). Then the main
   screenshot, captioned **Preview**.
2. Which level it uses, from the Overview's order: restyle, replace one part, compose, or change
   behaviour in the state layer.
3. "Start from the base app", linking to the Overview.
4. The steps, each with its code and, where it helps, a screenshot next to it.
5. How it works.
6. Related pages.

Every screenshot has a caption: a short bold line right above the image, **Preview** for the main
one and a few words saying what the image shows for the others (the site can't render image
captions below an image). Each captioned screenshot sits between two horizontal rules (`---`, with a
blank line on each side); consecutive screenshots share the rule between them.

A component and its stylesheet go in one `<Tabs>` block, the code tab labelled `React` and the
stylesheet tab `CSS`, each with its `title` (see the Pin indicator page).

Docs prose follows the v15 docs conventions: name methods as `Class.method()`, name every field with
its owner (`channel.state.typing`), say "paginator" for the object that loads items, and put example
scenarios in an `<Admonition type="info">` titled **Example**.

## Commands

Run from the repository root unless noted.

```bash
yarn install && yarn build                                 # the SDK the cookbook imports
yarn workspace @stream-io/stream-chat-react-cookbook seed  # demo data (idempotent)
yarn workspace @stream-io/stream-chat-react-cookbook dev   # http://localhost:5176
yarn workspace @stream-io/stream-chat-react-cookbook shots --out <getstream.io>/content/docs/chat-sdk/react/v15-rc/_assets [--only <group>/<recipe>]
yarn workspace @stream-io/stream-chat-react-cookbook check:css
yarn workspace @stream-io/stream-chat-react-cookbook build # type-check + build, as CI does
```

`shots` needs the dev server running and Playwright's Chromium (`npx playwright install chromium`).
A relative `--out` is resolved from the repository root; an absolute path is safest. Shots use the `en-US` locale
and the UTC time zone, so dates look the same on every machine. File names must be unique across
all recipes.

## Done when

- [ ] `check:css` passes.
- [ ] `build` passes, and `npx eslint --max-warnings 0` and `npx prettier --check` pass for the
      changed files.
- [ ] Every shot in `shots.json` is taken, looked at, and shows what the page says.
- [ ] The docs page's code matches the recipe folder.
- [ ] In getstream.io: the docs checks and the sample checker pass on the page, and the site builds.
- [ ] Anything that only renders wrong because of the SDK is reported, not hidden with CSS.
