This folder contains the source code for the [Chat React tutorial](https://getstream.io/chat/sdk/react/tutorial/). It contains multiple versions of apps representing the tutorial steps.

The tutorial source lives in the website repo at [`content/pages/chat_sdk_react_tutorial.mdx`](https://github.com/GetStream/getstream.io/blob/main/content/pages/chat_sdk_react_tutorial.mdx). (It used to live in `GetStream/getstream.io-tutorials`, which is now archived.)

## Step folders

Folder names match the tutorial's step numbers, so `4-channel-list` is the tutorial's "Step 4 - Add a channel list". The tutorial's Step 0 (environment) and Step 1 (project + credentials) have no runnable counterpart, so the folders start at 2. The two `optional-*` folders are the tutorial's optional recipes, which sit after the numbered path.

| Folder                            | Tutorial section                                  |
| --------------------------------- | ------------------------------------------------- |
| `2-client-setup`                  | Step 2 - Connect the client                       |
| `3-core-component-setup`          | Step 3 - Get a working chat UI                    |
| `4-channel-list`                  | Step 4 - Add a channel list                       |
| `5-theming`                       | Step 5 - Theme it                                 |
| `6-custom-ui-components`          | Step 6 - Replace an SDK component                 |
| `7-emoji-picker`                  | Step 7 - Enable the emoji picker and autocomplete |
| `optional-custom-attachment-type` | Optional - add a custom attachment type           |
| `optional-livestream`             | Optional - a livestream-style chat app            |

If you change a step's code here, update the matching code block in the tutorial too, and vice versa.

### `layout.css` is duplicated on purpose

The tutorial has the reader create a single `src/layout.css` in Step 3 and
rewrite it in Step 5. Each step folder here carries its own copy so the folder is
a self-contained snapshot of the app at that step, which means there are only two
distinct versions of the file:

| Version  | In                                                                         |
| -------- | -------------------------------------------------------------------------- |
| Step 3's | `3-core-component-setup`, `4-channel-list`                                 |
| Step 5's | `5-theming`, `6-custom-ui-components`, `7-emoji-picker`, both `optional-*` |

Every file in a group is byte-identical, so any drift shows up in a diff. If you
edit one, edit the whole group.

Parts of each copy are inert inside the step browser. That is expected, and none
of it should be "cleaned up" here, because the file has to stay a faithful copy of
what the tutorial tells the reader to write:

- The `custom-theme` tokens do nothing in `7-emoji-picker` and
  `optional-livestream`, which don't pass `theme="custom-theme"` to `<Chat>`. The
  reader's single `layout.css` holds the tokens and leaves them unused for those
  same two examples.
- The `.str-chat__channel-list` / `__channel` / `__thread` widths are overridden
  by `.tutorial-browser__step-shell .str-chat__*` in `tutorial-main.css`, which
  wins on specificity (0,2,0 against 0,1,0). The tutorial's widths assume the app
  owns the whole page; here it is sized to fit a preview card.
- The `html` / `body` / `#root` rules are real, but `tutorial-main.css` declares
  them too, so the chrome does not depend on a step's stylesheet.

None of this costs bundle size: Vite collapses the identical copies, so the built
CSS contains one `width: 30%` and one `@layer stream`.

### One deliberate deviation: unlayered theme tokens

The tutorial puts the custom theme tokens in a CSS layer:

```css
@layer stream, stream-overrides;
@import 'stream-chat-react/dist/css/index.css' layer(stream);

@layer stream-overrides {
  .custom-theme {
    /* tokens */
  }
}
```

The themed steps here declare them unlayered instead:

```css
@layer stream;
@import 'stream-chat-react/dist/css/index.css' layer(stream);

.str-chat.custom-theme {
  /* tokens */
}
```

Why: the step browser renders every step in a single document, so all seven
stylesheets are live at once. Steps 3 and 4 import the SDK stylesheet
_unlayered_ (as the tutorial has them, since Step 5 is where you're taught to
move it into a layer), and unlayered CSS outranks every `@layer` regardless of
specificity. A layered override would silently do nothing.

`.str-chat.custom-theme` (specificity 0,2,0) also beats the SDK's own
`.str-chat` (0,1,0) regardless of source order, and it only matches the steps
that actually pass `theme="custom-theme"`, so the themed steps can't leak into
the unthemed ones.

**This deviation exists only to make the step browser work. In your own app,
follow the tutorial and keep the tokens in the layer.**

The tutorial app is a Yarn workspace (`@stream-io/stream-chat-react-tutorial`) under the repo's monorepo, so it consumes the local `stream-chat-react` SDK through `workspace:^` and shares its dependencies with the root install.

## Setup

1. Install dependencies from the repo root (this populates the example's `node_modules` via workspaces):

   ```shell
   yarn install
   ```

2. Copy `.env.example` to `.env` in this folder and populate the credentials.

## Run the tutorial browser

From the repo root:

```shell
yarn start:tutorial
```

Or from within this folder:

```shell
yarn dev
```

`yarn dev` starts a simple tutorial browser that lets you switch between all steps from one sidebar.

## Build the tutorial browser

```shell
yarn build
```
