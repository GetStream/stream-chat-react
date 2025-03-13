import type { ObserverOrNext } from './Observer';
import { createObserver } from './Observer';
import { Subscription } from './Subscription';

export interface Unsubscribable {
  unsubscribe(): void;
}

type Producer<T> = (observer: ObserverOrNext<T>) => Subscription;

export interface Subscribable<T> {
  subscribe(observerOrNext: ObserverOrNext<T>): Unsubscribable;
}

export class Observable<T> implements Subscribable<T> {
  protected _closed = false;
  private _producer: Producer<T> | undefined;

  constructor(producer?: Producer<T>) {
    if (producer) this._producer = producer;
  }

  get closed() {
    return this._closed;
  }

  subscribe(observerOrNext: ObserverOrNext<T>): Subscription {
    const observer = createObserver<T>(observerOrNext);
    if (!this.closed) {
      this._producer?.(observer);
    }
    return new Subscription(() => {
      this._closed = true;
    });
  }
}
