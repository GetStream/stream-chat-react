/* eslint-disable no-undef */
const { configureAxe } = require('jest-axe');

module.exports.axe = configureAxe({
  // FIXME: this is a temporary measure, the SDK needs fixing
  rules: { 'nested-interactive': { enabled: false } },
});
