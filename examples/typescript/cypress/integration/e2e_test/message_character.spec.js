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

  it('send message to an active member () - type into a DOM element', () => {
    const input = 'Hello World!';
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
      .focus()
      .type(input, { delay: 100 })
      .should('exist')
      .type('{enter}');
  });
  it('.accepts and sends italics texts () - type into a DOM element', () => {
    const input = '_Hey!_';
    cy.get('div.rta').type(input, { delay: 100 }).type('{enter}').should('exist');
  });

  it('.accepts and send bold numbers and alphanumeric characters() - type into a DOM element', () => {
    const input1 = '**1234567890**';
    const input2 = '**1234567890 World!**';
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
      .type(input1, { delay: 100 })
      .type('{enter}')
      .type(input2, { delay: 100 })
      .type('{enter}')
      .should('exist');
  });
  it('accepts and send special characters() - type into a DOM element', () => {
    const input = '+-/*+#-.!';
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")

      .type('{enter}')
      .should('exist');
  });
});
