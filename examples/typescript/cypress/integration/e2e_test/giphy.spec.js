/// <reference types="cypress" />
context('Actions', () => {
  beforeEach(() => {
    const url = 'http://localhost:3000'
    cy.viewport('macbook-11');
    cy.visit(url, { timeout: 4000 })
    cy.dataTestContains('channel-preview-button').first().click().should('exist')
    cy.title()
    cy.waitFor(1000)
  })

  it('load and cancel giphy animation message() - type into a DOM element', () => {
    const input = '/giphy smile'
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
      .type(input, { timeout: 10000 })
      .type('{enter}')
    cy.get('[data-testid=image_action]').contains('Cancel').click().should('exist')
  })
  it('shuffle and cancel giphy animation message() - type into a DOM element', () => {
    const input = '/giphy smile'
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
      .type(input, { timeout: 1000 })
      .type('{enter}')
    cy.get('[data-testid=image_action]').contains('Shuffle').click().wait(1000).should('exist');
    cy.get('[data-testid=image_action]').contains('Cancel').click().should('exist');
  });
  it('send giphy animation message() - type into a DOM element', () => {
    const input = '/giphy dance';
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
      .focus()
      .type(input, { timeout: 10000 })
      .type('{enter}')
    cy.wait(1000)
    cy.get('[data-testid=image_action]').contains('Send').click().should('exist')
  })
})
