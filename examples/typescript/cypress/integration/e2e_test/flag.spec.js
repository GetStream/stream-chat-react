/// <reference types="cypress" />
context('Actions', () => {
  beforeEach(() => {
    const url = 'http://localhost:3000'
    console.log(screen);
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
  it('Flag conversation', function () {
    // hiding sub-menu flag
    cy.dataTestContains('channel-preview-button')
      .first()
      //.next()
      .then((element) => {
        cy.wrap(element).first().scrollIntoView().click({ force: true })
        cy.get('[data-testid="message-text-inner-wrapper"]').first();
        cy.get('li')
          .contains('Hello Ear')
          .first()
          .then((element) => {
            console.log(element);
            const cls = element.attr('class');
            cy.contains('[data-testid="message-inner"]', 'Hello Earth!')
            //cy.get('[data-testid="message-inner"]')
              //.should('include.text', 'Hello Ear')
              //.first()
              .then((element) => {
                cy.wrap(element).contains('Flag').click({ force: true })
                cy.get('[data-testid="custom-notification"]').invoke('text')
              })
          })
      })
  })
  it('Unflag conversation', function () {
    // hiding sub-menu Unflag
    cy.dataTestContains('channel-preview-button')
      .first()
      //.next()
      .then((element) => {
        cy.wrap(element).first().scrollIntoView().click({ force: true })
        cy.get('[data-testid="message-text-inner-wrapper"]').first();
        cy.get('li')
          .contains('Hello Ear')
          .first()
          .then((element) => {
            console.log(element);
            const cls = element.attr('class')
            cy.contains('[data-testid="message-inner"]', 'Hello Earth!')
              .then((element) => {
                cy.wrap(element).contains('Flag').click({ force: true })
                // there a bug the text says Flag instead of UnFlag
                cy.get('[data-testid="custom-notification"]').invoke('text')
              })
          })
      })
  })
})
