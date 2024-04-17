export interface SubscriptionLike {
  closed: boolean;

  unsubscribe(): void;
}

export class Subscription implements SubscriptionLike {
  closed = false;
  private _unsubscribe: (() => void) | undefined;

  constructor(unsubscribe?: () => void) {
    this._unsubscribe = unsubscribe;
  }

  unsubscribe() {
    this.closed = true;
    this._unsubscribe?.();
  }
}
