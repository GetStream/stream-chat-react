type Next<T> = (value: T) => void;
export type Observer<T> = {
  next(value: T): void;
  complete?(): void;
  error?(error: Error): void;
};
export type ObserverOrNext<T> = Next<T> | Observer<T>;

export function createObserver<T>(observerOrNext: ObserverOrNext<T>): Observer<T> {
  return typeof observerOrNext === 'function' ? { next: observerOrNext } : observerOrNext;
}
