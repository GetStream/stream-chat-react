#!/bin/bash

FOLDER_NAME="test-next-app"
PACKAGE_PATH="../../stream-chat-react.tgz"

rm -rf $FOLDER_NAME

yarn create next-app --typescript $FOLDER_NAME --no-eslint

# Apply a hello-world chat page to the project. 
cp ./next-page.tsx $FOLDER_NAME/pages/index.tsx

# install the lib...
yarn --cwd ./$FOLDER_NAME add --dev $PACKAGE_PATH stream-chat

echo NEXT_USER_ID=$USER_ID >> $FOLDER_NAME/.env.local
echo NEXT_USER_TOKEN=$USER_TOKEN >> $FOLDER_NAME/.env.local
echo NEXT_STREAM_API_KEY=$STREAM_API_KEY >> $FOLDER_NAME/.env.local

# and build - $? should be 0
yarn --cwd ./test-next-app build --no-lint

npx playwright test --config ./playwright.config.ts ./next.test.ts