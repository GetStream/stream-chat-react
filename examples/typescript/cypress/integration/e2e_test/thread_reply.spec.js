/// <reference types="cypress" />
context('Actions', () => {
  beforeEach(() => {
    const url = 'http://localhost:3000';
    cy.viewport('macbook-11');
    cy.visit(url, { timeout: 4000 });
    cy.dataTestContains('channel-preview-button').first().click().should('exist');
    cy.title();
    cy.waitFor(1000);
  });
  it('thread reply a message() - type into a DOM element', () => {
    cy.wait(10000);
    cy.xpath("//div[contains(@class,'message--has-text')]")
      .last()
      .invoke('mouseover')
      .click({ force: true });
    cy.dataTestContains('message-inner').last().invoke('show').should('exist');

    // this is for message thread-action
    const input = 'Greetings!, This is a text for Thread Reply';
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
      .focus()
      .type(input, { delay: 100 })
      .type('{enter}');
    cy.wait(1000);
    // hiding sub-menu Reply
    cy.dataTestContains('thread-action')
      .last()
      .invoke('mouseover')
      .then((element) => {
        const cls = element.attr('class');
        cy.wrap(element).click({ force: true }).should('have.class', cls);
        cy.wait(100);
        cy.title();
        const input = 'This is a Thread Reply';
        cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
          .last()
          .then((element) => {
            const cls = element.attr('class');
            cy.wrap(element).type(input, { delay: 100 }).should('have.class', cls).type('{enter}');
            // close thread reply
            cy.dataTestContains('close-button').click({ force: true });
            cy.wait(1000);
          });
      });
  });
});
