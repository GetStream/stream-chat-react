/// <reference types="cypress" />
context('Actions', () => {
  beforeEach(() => {
    const url = "http://localhost:3000"
    console.log(screen)
    cy.visit(url, {timeout:40000})
    cy.dataTestContains('channel-preview-button').first()
      .click()
      .should('exist')
    cy.title()
    cy.waitFor(10000)

  })  
 
it('open hidden menu and click Edit Message', function() {
  const input = 'Text to edit !'
  cy.xpath("//textarea[contains(@placeholder,'Type your message')]").focus()
    .type(input, { delay: 100 })
    .type('{enter}')
  cy.wait(1000)
  // hiding sub-menu Reply
  cy.get('li').last().then(element => {
      console.log(element)
      const cls = element.attr('class')
  cy.get('[data-testid="message-inner"]').should('include.text', 'Text to edit').last().then(element => {
    cy.wrap(element).contains('Edit Message').click({force: true})
      const input = "This is a new text',{enter}"
      cy.xpath("//textarea[contains(@placeholder,'Type your message')]").first()
        .clear({force: true})
        .type(input)
      cy.contains("Send").click({force: true})
      cy.wait(4000)
})
})
})
})
    

