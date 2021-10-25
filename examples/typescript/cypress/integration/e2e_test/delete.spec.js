/// <reference types="cypress" />
context('Actions', () => {
  beforeEach(() => {
    const url = 'http://localhost:3000';
    cy.viewport('macbook-11');
    cy.visit(url, { timeout: 40000 });
    cy.dataTestContains('channel-preview-button').first().click().should('exist');
    cy.title();
    cy.waitFor(10000);
  });

  it('open hidden menu and click Delete', function () {
    const input = 'Greetings2 text to delete!';
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
      .focus()
      .type(input, { delay: 100 })
      .type('{enter}');
    cy.wait(1000);
    // hiding sub-menu Reply
    cy.get('li')
      .last()
      .then((element) => {
        const cls = element.attr('class');
        cy.get('[data-testid="message-inner"]')
          .should('include.text', 'Greetings2 text to delete')
          .last()
          .then((element) => {
            cy.wrap(element).contains('Delete').click({ force: true });
          });
      });
  });
});
