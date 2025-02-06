import { Observable } from './Observable';
import type { SubscriptionLike } from './Subscription';
import { Subscription } from './Subscription';
import type { Observer, ObserverOrNext } from './Observer';
import { createObserver } from './Observer';

export class Subject<T> extends Observable<T> implements SubscriptionLike {
  private _observers: Map<number, Observer<T>> = new Map();
  private _observerCounter = 0;
  thrownError: Error | undefined;

  constructor() {
    super();
  }

  get observers() {
    return Array.from(this._observers.values());
  }

  next(value: T) {
    if (this.closed) return;
    const observers = this.observers;
    for (let i = 0; i < observers.length; i++) {
      observers[i].next(value);
    }
  }

  error(err: Error) {
    if (this.closed) return;
    this.thrownError = err;
    const { observers } = this;
    for (let i = 0; i < observers.length; i++) {
      observers[i].error?.(err);
    }
    this._observers.clear();
  }

  complete() {
    if (this.closed) return;
    this._closed = true;
    const { observers } = this;
    for (let i = 0; i < observers.length; i++) {
      observers[i].complete?.();
    }
    this._observers.clear();
  }

  subscribe(observerOrNext: ObserverOrNext<T>): Subscription {
    const observer = createObserver<T>(observerOrNext);
    if (this.thrownError || this.closed) {
      const subscription = new Subscription();
      subscription.closed = true;
      return subscription;
    }

    const observerId = this._observerCounter++;
    this._observers.set(observerId, observer);
    return new Subscription(() => {
      this._observers.delete(observerId);
    });
  }

  unsubscribe(): void {
    this._closed = true;
    this._observers.clear();
  }
}
