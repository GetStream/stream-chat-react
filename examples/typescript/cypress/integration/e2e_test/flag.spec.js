/// <reference types="cypress" />
context('Actions', () => {
  beforeEach(() => {
    const url = 'http://localhost:3000'
    cy.viewport('macbook-11')
    cy.visit(url, { timeout: 40000 })
    cy.dataTestContains('channel-preview-button').first().click().should('exist')
    cy.waitFor(10000)
  })

  it.skip('send message to active member () - type into a DOM element', () => {
    const input = 'Hello World!'
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
      .focus()
      .type(input, { delay: 100 })
      .should('exist')
      .type('{enter}')
  })
  it('Flag conversation for moderation', function () {
    // hiding sub-menu flag
    console.log(screen)
    cy.dataTestContains('channel-preview-button')
      .first()
      //.next()
      .then((element) => {
        cy.wrap(element).first().scrollIntoView().click({ force: true })
        cy.get('li').should('have', '09/30/2021').scrollIntoView().then((element) => {
          cy.wrap(element).scrollTo('topRight').invoke('text')
            cy.contains('[data-testid="message-inner"]', 'Hello Earth!')
              .then((element) => {
                cy.wrap(element).contains('Flag').click({ force: true })
                cy.get('[data-testid="custom-notification"]').invoke('text')
              })
          })
      })
  })
})
