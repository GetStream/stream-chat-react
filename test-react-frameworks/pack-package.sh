#!/bin/bash

# pack stream-chat-react. Linking causes issues with React.
FILE_NAME="stream-chat-react.tgz"
rm -rf ./$FILE_NAME
yarn pack --cwd "../" -f $FILE_NAME