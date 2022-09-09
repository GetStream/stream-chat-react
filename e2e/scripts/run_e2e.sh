#!/bin/bash
for browser in "webkit" "chromium" "firefox"; do
	yarn e2e-fixtures && yarn e2e --browser $browser $@
done
