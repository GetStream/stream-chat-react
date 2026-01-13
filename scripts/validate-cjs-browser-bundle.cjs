// As the community transitions to ESM, we can easily break our CJS bundle.
// This smoke test can help to detect this early.

const { JSDOM } = require('jsdom');
const dom = new JSDOM('', {
  url: 'https://localhost',
});

global.window = dom.window;

for (const key of Object.keys(window)) {
  if (global[key] === undefined) {
    global[key] = window[key];
  }
}

require('../dist/cjs/index.js');
