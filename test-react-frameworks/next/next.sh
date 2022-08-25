#!/bin/bash

rm -rf test-next-app

yarn create next-app --typescript test-next-app

# Apply a hello-world chat page to the project. 
cp ./next-page.tsx test-next-app/pages/index.tsx

cd test-next-app

# install the lib...
yarn add --dev ../stream-chat-react.tgz

# and build - $? should be 0
yarn build
