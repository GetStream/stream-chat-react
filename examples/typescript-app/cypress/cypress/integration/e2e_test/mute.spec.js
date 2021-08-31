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
it('Mute User', function() {
   // hiding sub-menu Mute
  cy.dataTestContains('channel-preview-button').contains('Social Demo')
      .click()
  const expected = 'has been muted'
  cy.get('li').contains('g-money').first().then(element => {
      console.log(element)
      const cls = element.attr('class')
  //cy.wrap(element).last().scrollIntoView().click({force: true})
  cy.contains('Mute').click({force: true})
cy.get('[data-testid="custom-notification"]').invoke('text')

})
})
it('Unmute User', function() {
    // hiding sub-menu Unmute
  cy.dataTestContains('channel-preview-button').contains('Social Demo')
      .click()
  const expected = 'has been unmuted'
  cy.get('li').first().next().scrollIntoView().then(element => {
      console.log(element)
      //const cls = element.attr('class')
  cy.contains('Unmute').click({force: true})
  console.log()
  cy.get('[data-testid="custom-notification"]').invoke('text')
})
})
})