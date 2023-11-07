#!/bin/bash

FOLDER_NAME="test-vite-app"
PACKAGE_PATH="../../stream-chat-react.tgz"

rm -rf $FOLDER_NAME

yarn create vite $FOLDER_NAME --template react-ts

cp ./App.tsx $FOLDER_NAME/src/

yarn --cwd ./$FOLDER_NAME add $PACKAGE_PATH 

# Vite does not recognize variables missing "VITE_" prefix
# https://vitejs.dev/guide/env-and-mode.html#env-files
echo VITE_USER_ID=\"$USER_ID\" >> $FOLDER_NAME/.env
echo VITE_USER_TOKEN=\"$USER_TOKEN\" >> $FOLDER_NAME/.env
echo VITE_STREAM_API_KEY=\"$STREAM_API_KEY\" >> $FOLDER_NAME/.env

npx playwright test --config ./playwright.config.ts ./vite.test.ts