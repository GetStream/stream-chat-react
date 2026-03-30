This folder contains the source code for [Chat React tutorial](https://github.com/GetStream/getstream.io-tutorials/blob/main/chat/tutorials/react-tutorial.mdx). It contains multiple versions of apps representing the tutorial steps.

The tutorial app is wired against the local `stream-chat-react` checkout so each step stays aligned with the current SDK implementation.

## Setup

1. Copy create a `.env` file next to the `.env.example` file.
2. Copy the contents of `.env.example` file into `.env` file and populate the credentials

## Run the tutorial browser

```shell
yarn dev
```

`yarn dev` starts a simple tutorial browser that lets you switch between all steps from one sidebar.

## Build the tutorial browser

```shell
yarn build
```
