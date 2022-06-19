import type { Page } from '@playwright/test';

export type TestingUser = ReturnType<typeof makeUser>;

type F = (page: Page) => Partial<Record<'click' | 'get' | 'see' | 'submit' | 'typeTo', unknown>>;

export function makeUser(page: Page) {
  return {
    clicks<T extends F>(f: T): ReturnType<T>['click'] {
      return f(page).click;
    },
    get<T extends F>(f: T): ReturnType<T>['get'] {
      return f(page).get;
    },
    sees<T extends F>(f: T): ReturnType<T>['see'] {
      return f(page).see;
    },
    submits<T extends F>(f: T): ReturnType<T>['submit'] {
      return f(page).submit;
    },
    typesTo<T extends F>(f: T): ReturnType<T>['typeTo'] {
      return f(page).typeTo;
    },
  };
}
