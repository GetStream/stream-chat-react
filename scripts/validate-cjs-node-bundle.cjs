// As the community transitions to ESM, we can easily break our CJS bundle.
// This smoke test can help to detect this early.

require('../dist/cjs/index.js');
require('../dist/cjs/ai-components.js');
require('../dist/cjs/openui.js');

// The A2UI renderer is an ES module only, and requiring it says so.
try {
  require('stream-chat-react/a2ui');
  throw new Error('stream-chat-react/a2ui loaded with require');
} catch (error) {
  if (!/an ES module only/.test(error.message)) throw error;
}
