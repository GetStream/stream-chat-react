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

### One deliberate deviation: theme scoping

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

The themed steps here instead use an unlayered, step-scoped selector:

```css
@layer stream;
@import 'stream-chat-react/dist/css/index.css' layer(stream);

.step-theming .custom-theme {
  /* tokens */
}
```

Why: the step browser renders every step in a single document, so all eight
stylesheets are live at once. Steps 3 and 4 import the SDK stylesheet
_unlayered_ (as the tutorial has them, since Step 5 is where you're taught to
move it into a layer), and unlayered CSS outranks every `@layer` regardless of
specificity. A layered override would silently do nothing, and an unscoped one
would restyle the earlier steps.

The `step-<id>` class is applied by the browser in `src/App.tsx`, on the wrapper
around the active step.

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
