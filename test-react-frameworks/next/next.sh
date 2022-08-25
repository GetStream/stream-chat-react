#!/bin/bash

rm -rf test-next-app

yarn create next-app --typescript test-next-app

# Apply a hello-world chat page to the project. 
cp ./next-page.tsx test-next-app/pages/index.tsx

# install the lib...
yarn --cwd ./test-next-app add --dev ../../stream-chat-react.tgz

# and build - $? should be 0
yarn --cwd ./test-next-app build
