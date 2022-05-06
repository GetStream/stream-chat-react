/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import { expect, test } from '@playwright/test';

const suiteArray = [
  ['virtualized', 'jump-to-message--jump-in-virtualized-message-list'],
  ['regular', 'jump-to-message--jump-in-regular-message-list'],
];

suiteArray.forEach(([mode, story]) => {
  test.describe(`jump to message - ${mode}`, () => {
    test.beforeEach(async ({ baseURL, page }) => {
      await Promise.all([
        page.waitForSelector('data-testid=message-text-inner-wrapper >> text=Message 149'),
        page.goto(`${baseURL}/?story=${story}`),
      ]);
    });

    test(`${mode} jumps to message 29 and then back to bottom`, async ({ page }) => {
      const message29 = page.locator('text=Message 29');
      await expect(message29).not.toBeVisible();
      await page.click('data-testid=jump-to-message');
      await expect(message29).toBeVisible();
      await page.click('text=Latest Messages');
      await expect(
        page.locator('data-testid=message-text-inner-wrapper >> text=Message 149'),
      ).toBeVisible();
    });

    test(`${mode} jumps to quoted message`, async ({ page }) => {
      await page.click('.quoted-message :text("Message 20")');
      await expect(page.locator('text=Message 20')).toBeVisible();
    });
  });
});

test.describe('jump to messsage - dataset', () => {
  test('only the current message set is loaded', async ({ baseURL, page }) => {
    await Promise.all([
      page.waitForSelector('data-testid=message-text-inner-wrapper >> text=Message 149'),
      page.goto(`${baseURL}/?story=jump-to-message--jump-in-regular-message-list`),
    ]);

    await Promise.all([
      page.waitForSelector('text=Message 29'),
      page.click('data-testid=jump-to-message'),
    ]);

    const listItems = page.locator('.str-chat__ul > li');
    await expect(listItems).toHaveCount(26);
  });
});
