#!/bin/bash

FOLDER_NAME="test-vite-app"
PACKAGE_PATH="../../stream-chat-react.tgz"

rm -rf $FOLDER_NAME

yarn create vite $FOLDER_NAME --template react-ts

cp ./App.tsx $FOLDER_NAME/src/

yarn --cwd ./$FOLDER_NAME add $PACKAGE_PATH 

# yarn --cwd ./$FOLDER_NAME build

npx playwright test --config ./playwright.config.ts ./vite.test.ts