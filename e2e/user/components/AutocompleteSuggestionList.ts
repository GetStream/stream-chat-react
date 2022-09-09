import type { Page } from '@playwright/test';

export const getAutocompleteSuggestionItem = (page: Page, num: number) =>
  page.locator(
    `.str-chat__suggestion-list-item >> :nth-match(span.str-chat__user-item--name, ${num})`,
  );

export default (page: Page) => ({
  click: {
    async nth(num: number) {
      const item = await getAutocompleteSuggestionItem(page, num);
      item.click();
      return item;
    },
  },
  see: {},
});
