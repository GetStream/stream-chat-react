/// <reference types="cypress" />
context('Actions', () => {
  beforeEach(() => {
    const url = "http://localhost:3000"
    console.log(screen)
    cy.visit(url, {timeout:40000})
    cy.dataTestContains('channel-preview-button').first()
      .click()
      .should('exist')
    cy.title()
    cy.waitFor(10000)

  })  

it('accepts and sends external url() - type into a DOM element', () => {
  const input = "https://getstream.io"
  //cy.get('div.rta').click()
  cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
  .type(input, { delay: 100 }) 
  .type('{enter}') 

})
})
