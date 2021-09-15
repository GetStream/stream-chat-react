/// <reference types="cypress" />

context('Actions', () => {
  beforeEach(() => {
    const url = "http://localhost:3000"
    console.log(screen)
    cy.waitFor(10000)
    cy.visit(url, {timeout:12000})
    cy.dataTestContains('channel-preview-button').first()
      .click()
      .should('exist')
    cy.title()
    cy.waitFor(10000)

  })  
    it('Navigate to general channel', () => { 
    const channel_more = 'load-more-button'
      const channel_last_preview = 'channel-preview-button'
      const input = 'Succesfully loaded {enter}'
      cy.dataTestContains(channel_more).click({force: true}).should('be.visible')
      cy.xpath("//button[contains(@class,'str-chat__channel-preview-messenger  ')]").last().next().then(element => {
      console.log()
      cy.wrap(element).click({force: true})
      cy.get('[data-testid="channel-preview-button"]').last().click({force: true})
      cy.waitFor(10000)
      cy.dataTestContains('channel-preview-button').contains('general')
        .click()
      cy.xpath("//textarea[contains(@placeholder,'Type your message')]").focus()
        .type(input, {timeout:100})
        .type('{enter}')
        .should('exist')
      cy.title()
      cy.waitFor(10000)
    })    
})
it('Select last channel from load more menu', () => { // TO DO
  const channel_more = 'load-more-button'
  const channel_last_preview = 'channel-preview-button'
  cy.dataTestContains(channel_more).click({force: true})
  cy.xpath("//button[contains(@class,'str-chat__channel-preview-messenger  ')]").last().next().then(element => {
  console.log()
  cy.wrap(element).click({force: true})
  cy.get('[data-testid="channel-preview-button"]').last().click({force: true})

})
})
/* it('Populate text on all channels', () => { // TO DO
  const channel_more = 'load-more-button'
  const channel_last_preview = 'channel-preview-button'
  const input = 'Testing 12345 {enter}'
  cy.dataTestContains(channel_more).click({force: true})
  cy.wait(10000)
  cy.get('[data-testid="channel-preview-button"]').each(element => {
    console.log()
  cy.wrap(element).click({force: true})
  cy.xpath("//textarea[contains(@placeholder,'Type your message')]").focus()
    .type(input, {timeout:100})
    .type('{enter}')
  cy.wait(100)

}) 
})*/
})