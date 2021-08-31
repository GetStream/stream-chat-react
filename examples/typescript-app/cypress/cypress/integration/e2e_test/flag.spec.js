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
    
    it('send message to active member () - type into a DOM element', () => {
      const input = 'Hello World!'
      cy.xpath("//textarea[contains(@placeholder,'Type your message')]").focus()
      .type(input, { delay: 100 })
      .should('exist')
      .type('{enter}')

}) 
it('Flag conversation', function() {
  // hiding sub-menu flag
  cy.dataTestContains('channel-preview-button').contains('Social Demo').click()
  cy.get('li').contains('Hey').then(element => {
      console.log(element)
      const cls = element.attr('class')
  cy.wrap(element).should('have.text', 'Hey').last()
  cy.contains('Flag').click({force: true})
  cy.get('[data-testid="custom-notification"]').invoke('text')

}) 
})
it('Unflag conversation', function() {
     // hiding sub-menu Unflag
  cy.dataTestContains('channel-preview-button').contains('Social Demo')
  .click()
  cy.get('li').last().then(element => {
      console.log(element)
      const cls = element.attr('class')
  cy.get('[data-testid="message-inner"]').should('include.text', 'Hey').last().then(element => {
  cy.wrap(element).contains('Unflag').click({force: true})
  cy.get('[data-testid="custom-notification"]').invoke('text')

})
})
})
})