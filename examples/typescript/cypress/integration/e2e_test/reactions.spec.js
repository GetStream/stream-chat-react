/// <reference types="cypress" />
context('Actions', () => {
  beforeEach(() => {
    const url = 'http://localhost:3000';
    console.log(screen);
    cy.viewport('macbook-11');
    cy.visit(url, { timeout: 40000 });
    cy.dataTestContains('channel-preview-button').first().click().should('exist');
    cy.title();
    cy.waitFor(10000);
  });

  it('send message to active member () - type into a DOM element', () => {
    const input = 'Hello World!';
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
      .focus()
      .type(input, { delay: 100 })
      .should('exist')
      .type('{enter}');
  });

  it(' add reactions to a message () - type into a DOM element', () => {
    cy.waitFor(1000);
    cy.xpath("//div[contains(@class,'message--has-text')]")
      .last()
      .invoke('mouseover')
      .click({ force: true });
    cy.dataTestContains('message-inner').last().invoke('show').should('exist');

    // this is for message reactions
    cy.dataTestContains('message-reaction-action')
      .last()
      .invoke('mouseover')
      .then((element) => {
        console.log(element);
        const cls = element.attr('class');
        cy.wrap(element).click({ force: true }).should('have.class', cls);
        cy.get('[data-text="love"]').click({ force: true }).invoke('click');
      });
  });
  it('remove reactions to a message () - type into a DOM element', () => {
    cy.xpath("//div[contains(@class,'message--has-text')]")
      .last()
      .invoke('mouseover')
      .click({ force: true });
    cy.dataTestContains('message-inner').last().invoke('show').should('exist');

    // this is for message reactions
    cy.dataTestContains('message-reaction-action')
      .last()
      .invoke('mouseover')
      .then((element) => {
        console.log(element);
        const cls = element.attr('class');
        cy.wrap(element).click({ force: true }).should('have.class', cls);
        cy.get('[data-text="love"]').click({ force: true }).invoke('click');
        cy.wait(10000);
      });
  });
});
