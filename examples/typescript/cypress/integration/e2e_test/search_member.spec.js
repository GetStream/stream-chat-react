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

  it('.typesearch-negative() - type into a DOM element', () => {
    const input = 'z';
    cy.get('input[placeholder=Search]').type('z', { delay: 1000 }).should('exist');
    cy.waitFor(100);
  });
  it('.search and select member channel,-positive() - type into a DOM element', () => {
    const input = 'd';
    cy.get('input[placeholder=Search]').type(input, { delay: 1000 }).should('exist');
    cy.xpath(
      "//div[@class='str-chat__channel-search-container inline'][contains(.,'red-dust-7dangetstreamiodaddy-dan')]",
    );
    cy.xpath("(//div[contains(@class,'str-chat__channel-search-result ')])[3]")
      .eq(0)
      .click({ force: true }, { delay: 100 });
    cy.waitFor(1000);
  });
});
