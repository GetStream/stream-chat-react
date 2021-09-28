/// <reference types="cypress" />

context('Actions', () => {
  beforeEach(() => {
    const url = "http://localhost:3000"
    console.log(screen)
    cy.viewport("macbook-11")
    cy.visit(url, {timeout:12000})
    cy.dataTestContains('channel-preview-button').first()
      .click()
      .should('exist')
    cy.title()
    cy.waitFor(10000)

  })  
    it('Get first channel text and send text', () => { 
      const channel_last_preview = 'channel-preview-button'
      const channel_more = 'load-more-button'
      // get first channel text
      cy.xpath("//button[@data-testid='channel-preview-button']").first().invoke('text')
      //cy.get('[data-testid="channel-preview-button"]').first().invoke('text')
      const input = 'Last channel text {enter}'
      cy.dataTestContains(channel_more).click({force: true}).should('be.visible')
      cy.wait(1000)
      cy.dataTestContains(channel_more).click({force: true}).should('be.visible')
      cy.dataTestContains('channel-preview-button').last().click().invoke('text')
      cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
        .type(input, {timeout:100})
        .type('{enter}')
      cy.waitFor(10000) 
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
  cy.wait(100)*/

