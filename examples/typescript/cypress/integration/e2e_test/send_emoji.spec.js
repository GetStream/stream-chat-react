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
  it('send emoji', function () {
    cy.xpath("//span[contains(@class,'str-chat__input-flat-emojiselect')]").click();
    cy.waitFor(100);
    cy.xpath("(//ul[@class='emoji-mart-category-list'])[2]").then((element) => {
      const cls = element.attr('class');
      cy.wrap(element).should('have.class', cls);
      cy.get("*[class^='emoji-mart-emoji emoji-mart-emoji-native']")
        .first()
        .click({ force: true })
        .type('{esc}');
      cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
        .click()
        .type('Hello Earth!', { delay: 100 })
        .type('{enter}');
    });
  });
});
