/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import { expect, test } from '@playwright/test';

test.describe('autocomplete a mention', () => {
  test('should fill in textarea with username', async ({ baseURL, page }) => {
    await page.goto(`${baseURL}/?story=hello--basic-setup`);
    await page.waitForSelector('[data-storyloaded]');
    await page.fill('data-testid=message-input', '@');
    const button = await page.locator(
      'button.rta__entity >> :nth-match(span.str-chat__user-item--name, 1)',
    );
    button.click();
    const textContent = await button.textContent();

    await expect(page.locator('data-testid=message-input')).toContainText(`@${textContent}`);
  });
});
