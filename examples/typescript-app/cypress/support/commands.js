// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
import 'cypress-file-upload'
import 'cypress-wait-until'
import '@testing-library/cypress/add-commands';

Cypress.Commands.add('dataTest', { prevSubject: 'optional' }, (subject, value, options) => {
    if (subject) {
      return cy.wrap(subject).find(`[data-testid=${value}]`, options);
    }
  
    return cy.get(`[data-testid=${value}]`, options);
  });

  Cypress.Commands.add(
    'dataTestContains',
    { prevSubject: 'optional' },
    (subject, value, wildCard = '*', options) => {
      if (subject) {
        return cy.wrap(subject).find(`[data-testid${wildCard}=${value}]`, options);
      }
  
      return cy.get(`[data-testid${wildCard}=${value}]`, options);
    }
  );