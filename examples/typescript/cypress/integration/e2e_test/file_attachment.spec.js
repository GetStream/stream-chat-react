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

  it('Files Upload1 - attach images', () => {
    const imagefile = 'download.png';
    const imagefile1 = 'getstream1.png';
    const imagefile2 = 'image2.jpg';
    cy.wait(1000);
    cy.xpath("//input[contains(@class,'rfu-file-input')]").attachFile([
      imagefile,
      imagefile1,
      imagefile2,
    ]);
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
      .focus()
      .type('Hello Earth!', { delay: 100 })
      .type('{enter}');
    cy.waitFor(10000);
  });
  it('Files Upload2 - attach audio file-mp3', () => {
    const audiofile1 = 'Cypress End-to-End Testing.mp3';
    cy.waitFor(1000);
    cy.xpath("//input[contains(@class,'rfu-file-input')]").attachFile(audiofile1);
    cy.waitFor(audiofile1);
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
      .focus()
      .type('MP3 audio - 13,8 MB', { delay: 2000 })
      .should('exist')
      .type('{enter}');
    cy.waitFor(100);
  });

  it('Files Upload3 - attach video file', () => {
    // TO DO
    const special = 'Cypress End-to-End Testing.mp4';
    cy.fixture(special, 'binary')
      .then(Cypress.Blob.binaryStringToBlob)
      .then((fileContent) => {
        cy.xpath("//input[contains(@class,'rfu-file-input')]").attachFile({
          fileContent,
          filePath: special,
          encoding: 'utf-8',
          lastModified: new Date().getTime(),
        });
        cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
          .focus()
          .type('MPEG-4 movie - 18 MB', { delay: 1000 })
          .should('exist')
          .type('{enter}');
        cy.waitFor(100);
      });
  });

  it('Files Upload4 - attach attach multiples', () => {
    const imagefile1 = 'download.png';
    const jsonfile = 'myfixture.json';
    const textfile = 'message.txt';
    const input = 'Hello Earth!';
    cy.waitFor(1000);
    cy.xpath("//input[contains(@class,'rfu-file-input')]").attachFile([
      imagefile1,
      jsonfile,
      textfile,
    ]);
    cy.xpath("//textarea[contains(@placeholder,'Type your message')]")
      .focus()
      .type(input, { delay: 100 })
      .should('exist')
      .type('{enter}');
    cy.waitFor(10000);
  });
});
