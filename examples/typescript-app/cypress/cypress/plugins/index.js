/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
const { spawn } = require('child_process');
/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  let sp1;
  let sp2;
  on('before:run', () => {
    sp1 = spawn('npm', ['start'], {cwd:'/Users/joeladelubi/stream-chat-react'});
    sp2 = spawn('npm', ['start'], {cwd:'/Users/joeladelubi/stream-chat-react/examples/typescript-app'});
  })
  on('after:run', () => {
    sp1.kill();
    sp2.kill();
  });
}
