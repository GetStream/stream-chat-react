/// <reference types="cypress" />

context('Actions', () => {
  beforeEach(() => {
    const url = 'http://localhost:3000';
    cy.viewport('macbook-11');
    cy.visit(url, { timeout: 1000 });
    cy.dataTestContains('channel-preview-button').first().click().should('exist');
    cy.title();
    cy.waitFor(5000);
  });

  it('open hidden menu and click Reply', function () {
    const input = 'Greetings!, this is a text to Reply to'
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
      .focus()
      .type(input, { delay: 100 })
      .type('{enter}')
    cy.wait(1000)
    // hiding sub-menu Reply
    cy.get('li')
      .last()
      .then((element) => {
        const cls = element.attr('class')
        cy.get('[data-testid="message-inner"]')
          .should('include.text', 'Greetings!')
          .last()
          .then((element) => {
            cy.wrap(element).contains('Reply').click({ force: true })
            const input = 'this is a reply text!,{enter}'
            cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
              .focus()
              .type(input)
              .type('{enter}')
              .should('exist')
            cy.wait(1000)
          })
      })
  })

  it('Reply received conversation', function () {
    // hiding sub-menu Reply

      cy.get('li')
          .then((element) => {
            console.log(element)
            const cls = element.attr('class')
            cy.contains('[data-testid="message-inner"]', 'Hello Earth!')
              .then((element) => {
                cy.wrap(element).contains('Reply').click({ force: true })
                const input = 'This is a reply text!{enter}'
            cy.xpath("//button[contains(@class,'square-button')]").click({ force: true })
      //Repeat step
      cy.contains('[data-testid="message-inner"]', 'Hello Earth!')
              .then((element) => {
                cy.wrap(element).contains('Reply').click({ force: true })
                const input = 'This is a reply text!{enter}'
      cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
        .focus()
        .type(input, { timeout: 500 })
        .type('{enter}')
    })
  })
    })
  })
})
