// Setup for the real-browser projects (`*.browser.test.tsx`). Unlike jsdom, the browser lays the
// list out, so the SDK's own styles are loaded: item measurements depend on them.
import '@testing-library/jest-dom/vitest';
import './src/styling/index.scss';

document.documentElement.style.setProperty('font-family', 'Arial, sans-serif');

// The browser renders asynchronously as in an app: React's `act()` batching would hide exactly the
// frame-by-frame behavior these suites observe, and warns about every update made outside it.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
