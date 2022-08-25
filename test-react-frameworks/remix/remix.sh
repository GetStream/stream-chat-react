#!/bin/bash

rm -rf test-remix-app

yes | yarn create remix --template remix-run/indie-stack test-remix-app

# Apply a hello-world chat page to the project. 
cp ./remix-index-route.tsx test-remix-app/app/routes/index.tsx

cd test-remix-app

# install the lib...
yarn add --dev ../stream-chat-react.tgz

# and build - $? should be 0
yarn build
