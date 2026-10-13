// As the community transitions to ESM, we can easily break our CJS bundle.
// This smoke test can help to detect this early.

require('../dist/cjs/index.js');
require('../dist/cjs/ai-components.js');
