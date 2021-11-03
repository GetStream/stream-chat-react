/// <reference types="cypress" />

context('Actions', () => {
  beforeEach(() => {
    const url = 'http://localhost:3000'
    cy.waitFor(10000)
    cy.viewport('macbook-11')
    cy.visit(url, { timeout: 5000 })
    cy.dataTestContains('channel-preview-button').first().click().should('exist')
    cy.title()
    cy.waitFor(10000)
  })
  it.skip('Populate text on all channels', () => {
    const channel_more = 'load-more-button'
    const channel_last_preview = 'channel-preview-button'
    const input = 'Hello Earth! {enter}'
    cy.xpath("//button[@data-testid='channel-preview-button']").first().invoke('text')
    cy.dataTestContains(channel_more).click({force: true}).should('be.visible')
    cy.wait(1000)
    cy.get('[data-testid="channel-preview-button"]').each(element => {
    cy.wrap(element).click({force: true})
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]").focus()
      .type(input, {timeout:100})
      .type('{enter}')
    cy.wait(100)
  })
  })
  it('Verify First Channel Interaction - Get first channel text and send text', () => {
    // get first channel text
    cy.xpath("//button[@data-testid='channel-preview-button']").first().invoke('text')
    const input = 'Last channel text {enter}'
    cy.dataTestContains('channel-preview-button').last().click().invoke('text')
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]").focus()
      .type(input, {timeout:100})
      .type('{enter}')
    cy.waitFor(1000)
  })
})
