#!/usr/bin/env bash

mkdir -p dist/assets dist/css/v2 dist/scss/v2

cp -r node_modules/@stream-io/stream-chat-css/dist/assets/* dist/assets
cp -r node_modules/@stream-io/stream-chat-css/dist/css/*.css dist/css
cp -r node_modules/@stream-io/stream-chat-css/dist/scss/* dist/scss
cp -r node_modules/@stream-io/stream-chat-css/dist/v2/css/*.css dist/css/v2
cp -r node_modules/@stream-io/stream-chat-css/dist/v2/scss/* dist/scss/v2
