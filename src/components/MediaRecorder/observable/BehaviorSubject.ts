import { Subject } from './Subject';
import type { ObserverOrNext } from './Observer';
import { createObserver } from './Observer';
import type { Subscription } from './Subscription';

export class BehaviorSubject<T> extends Subject<T> {
  constructor(private _value: T) {
    super();
  }

  get value(): T {
    const { _value, thrownError } = this;
    if (thrownError) {
      throw thrownError;
    }
    return _value;
  }

  subscribe(observerOrNext: ObserverOrNext<T>): Subscription {
    const observer = createObserver<T>(observerOrNext);
    const subscription = super.subscribe(observerOrNext);
    if (!subscription.closed) observer.next(this._value);
    return subscription;
  }

  next(value: T): void {
    super.next((this._value = value));
  }
}
