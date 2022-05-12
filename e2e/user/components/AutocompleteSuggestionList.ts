import type { Page } from '@playwright/test';



export async function  getAutocompleteSuggestionItem(page: Page, num: number) {
  return page.locator(
    `button.rta__entity >> :nth-match(span.str-chat__user-item--name, ${num})`,
  );
}
export default (page: Page) => {
  return {
    see: {

    },
    click: {
      async nth(num: number) {
        const item = await getAutocompleteSuggestionItem(page, num);
        item.click();
        return item;
      }
    }
  }
}
