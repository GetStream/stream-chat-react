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
  it('Mute User', function () {
    // hiding sub-menu Mute and requires message from another user 
    cy.dataTestContains('channel-preview-button')
      .first()
      .next()
      .then((element) => {
        cy.wrap(element).first().scrollIntoView().click({ force: true });
        cy.get('[data-testid="message-text-inner-wrapper"]').first();
        cy.get('li')
          .contains('Hello Ear')
          .first()
          .then((element) => {
            console.log(element);
            const cls = element.attr('class');
            cy.get('[data-testid="message-inner"]')
              .should('include.text', 'Hello Ear')
              .first()
              .then((element) => {
                cy.wrap(element).contains('Mute').click({ force: true });
                cy.get('[data-testid="custom-notification"]').invoke('text');
              });
          });
      });
  });
  it('Unmute User', function () {
    // hiding sub-menu Unmute and requires message from another user 
    cy.dataTestContains('channel-preview-button')
      .first()
      .next()
      .then((element) => {
        cy.wrap(element).first().scrollIntoView().click({ force: true });
        cy.get('[data-testid="message-text-inner-wrapper"]').first();
        cy.get('li')
          .contains('Hello Ear')
          .first()
          .then((element) => {
            console.log(element);
            const cls = element.attr('class');
            cy.get('[data-testid="message-inner"]')
              .should('include.text', 'Hello Ear')
              .first()
              .then((element) => {
                cy.wrap(element).contains('Unmute').click({ force: true });
                cy.get('[data-testid="custom-notification"]').invoke('text');
              });
          });
      });
  });
});
