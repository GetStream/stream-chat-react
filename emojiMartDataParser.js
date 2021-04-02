/*
 * This script allows us to generate a version of the emoji-mart json data stripped of skin variation information.
 * Emoji data has a significant contribution to the bundle size, and skin variation information takes a good part
 * of the full data set json file.
 */
const path = require('path');
const fs = require('fs');

// Getting the facebook dataset as it is the smallest one.
const defaultDataSetJson = fs.readFileSync(
  path.join(__dirname, 'node_modules', 'emoji-mart', 'data', 'facebook.json'),
  'utf8',
);

const dataSet = JSON.parse(defaultDataSetJson);

const removeSkinTonesInfo = (emojiKey) => {
  if (dataSet.emojis[emojiKey].skin_variations) {
    delete dataSet.emojis[emojiKey].skin_variations;
  }
};

Object.keys(dataSet.emojis).map(removeSkinTonesInfo);

const newDataSetJson = JSON.stringify(dataSet);

fs.writeFileSync(path.join(__dirname, 'src', 'stream-emoji.json'), newDataSetJson);
