#!/bin/bash

FOLDER_NAME="test-remix-app"
PACKAGE_PATH="../../stream-chat-react.tgz"

rm -rf $FOLDER_NAME

yes | yarn create remix --template remix-run/indie-stack $FOLDER_NAME

# Apply a hello-world chat page to the project. 
cp ./remix-index-route.tsx $FOLDER_NAME/app/routes/index.tsx

# install the lib...
yarn --cwd ./$FOLDER_NAME add --dev $PACKAGE_PATH stream-chat

echo REMIX_USER_ID=$USER_ID >> $FOLDER_NAME/.env
echo REMIX_USER_TOKEN=$USER_TOKEN >> $FOLDER_NAME/.env
echo REMIX_STREAM_API_KEY=$STREAM_API_KEY >> $FOLDER_NAME/.env

# and build - $? should be 0
yarn --cwd ./$FOLDER_NAME build

npx playwright test --config ./playwright.config.ts ./remix.test.ts