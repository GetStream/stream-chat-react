This folder contains the source code for [Chat React tutorial](https://github.com/GetStream/getstream.io-tutorials/blob/main/chat/tutorials/react-tutorial.mdx). It contains multiple versions of apps representing the tutorial steps.

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
