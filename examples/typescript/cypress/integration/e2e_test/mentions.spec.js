/// <reference types="cypress" />
context('Actions', () => {
  beforeEach(() => {
    const url = "http://localhost:3000"
    console.log(screen)
    cy.viewport("macbook-11")
    cy.visit(url, {timeout:40000})
    cy.dataTestContains('channel-preview-button').first()
      .click()
      .should('exist')
    cy.title()
    cy.waitFor(10000)

  })  
it('mention first member in a message() - type into a DOM element', () => {
    const input = "@,{enter}"
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
      .type('Greetings')
      .type(input)
      .type('{enter}')
      .should('exist')
    cy.wait(4000)


})
})