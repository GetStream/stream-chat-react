#!/usr/bin/env bash

echo -e "\033[34mℹ\033[0m Copying Version to \033[34msrc/version.ts\033[0m"
PACKAGE_VERSION=$(node -pe 'require(`./package.json`).version')
PACKAGE_STRING=\"'$PACKAGE_VERSION'\"
echo 'export const version = '$PACKAGE_STRING';' > ./src/version.ts
echo -e "\033[32m✓\033[0m Done Copying Version"