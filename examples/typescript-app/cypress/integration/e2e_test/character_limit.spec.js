/// <reference types="cypress" />

context('Actions', () => {
  beforeEach(() => {
    const url = "http://localhost:3000"
    console.log(screen)
    cy.visit(url, {timeout:120000})
    cy.dataTestContains('channel-preview-button').first()
      .click()
      .should('exist')
    cy.title()
    cy.waitFor(10000)

  })  
it('Negative Test - Send above 5000 characters limits - should be rejected() - type into a DOM element', () => {
  const fileName= 'cypress/fixtures/Above5000character.txt'
  cy.readFile(fileName).then((text) => {
  const input = text
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
    .type(input)
    .type('{enter}')
    .click()
    .type('{enter}')
    cy.get("*[class^='str-chat__simple-message--error-message']").invoke('text')
    cy.get('[data-testid="message-text-inner-wrapper"]').last().should('include.text', 'larger').invoke('text')

})
})

it('Positive Test - Send 5000 characters limits should be accepted() - type into a DOM element', () => {
  const fileName= 'cypress/fixtures/5000character.txt'
  cy.readFile(fileName).then((text) => {
  const input = text
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
    .type(input)
    .type('{enter}')
    .click()
    .type('{enter}')

})
})
})