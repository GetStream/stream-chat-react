/// <reference types="cypress" />
context('Actions', () => {
  beforeEach(() => {
    const url = 'http://localhost:3000'
    cy.viewport('macbook-11')
    cy.visit(url, { timeout: 4000 })
    cy.dataTestContains('channel-preview-button').first().click().should('exist')
    cy.title()
    cy.waitFor(1000);
  })

  it('send message to active member () - type into a DOM element', () => {
    const input = 'Hello World!';
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
      .focus()
      .type(input, { delay: 100 })
      .should('exist')
      .type('{enter}');
  })
  it('Mute User', function () {
    // hiding sub-menu Mute and requires message from another user 
    cy.dataTestContains('channel-preview-button')
      .first()
      .then((element) => {
        cy.wrap(element).first().scrollIntoView().click({ force: true })
        cy.contains('[data-testid="message-inner"]', 'Hello Earth!')
          .then((element) => {
            console.log(element)
            const cls = element.attr('class')
            cy.contains('[data-testid="message-inner"]', 'Hello Earth!')
              .then((element) => {
                cy.wrap(element).contains('Mute').click({ force: true })
                cy.get('[data-testid="custom-notification"]').invoke('text')
              })
          })
      })
  })
  it('Unmute User', function () {
    // hiding sub-menu Unmute and requires message from another user 
    cy.dataTestContains('channel-preview-button')
      .first()
      .then((element) => {
        cy.wrap(element).first().scrollIntoView().click({ force: true })
        cy.contains('[data-testid="message-inner"]', 'Hello Earth!')
          .then((element) => {
            console.log(element)
            const cls = element.attr('class')
            cy.contains('[data-testid="message-inner"]', 'Hello Earth!')
              .then((element) => {
                cy.wrap(element).contains('Unmute').click({ force: true })
                cy.get('[data-testid="custom-notification"]').invoke('text')
              })
          })
      })
  })
})
