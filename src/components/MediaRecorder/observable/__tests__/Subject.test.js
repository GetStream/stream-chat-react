import { Subject } from '../Subject';

const emittedValues = ['emitted-1', 'emitted-2'];
const errors = emittedValues.map((val) => new Error(val));

describe('Subject', () => {
  it('emits value to all observers', () => {
    const subject = new Subject();
    const observers = Array.from({ length: 5 }, () => jest.fn());
    observers.forEach((observer) => subject.subscribe(observer));
    emittedValues.forEach((emitted) => {
      subject.next(emitted);
      observers.forEach((observer) => expect(observer).toHaveBeenCalledWith(emitted));
    });
    expect(subject.observers).toHaveLength(5);
  });

  it('emits error to all observers', () => {
    const subject = new Subject();
    const observers = Array.from({ length: 5 }, () => ({
      error: jest.fn(),
      next: jest.fn(),
    }));
    observers.forEach((observer) => subject.subscribe(observer));

    errors.forEach((emitted) => {
      subject.error(emitted);
    });

    observers.forEach((observer) => {
      expect(observer.error).toHaveBeenCalledWith(errors[0]);
      expect(observer.error).toHaveBeenCalledTimes(1);
    });

    expect(subject.observers).toHaveLength(0);
    expect(subject.thrownError).toBe(errors[1]);
  });

  it('completes all subscriptions', () => {
    const subject = new Subject();
    const observers = Array.from({ length: 5 }, () => ({
      complete: jest.fn(),
      next: jest.fn(),
    }));
    observers.forEach((observer) => subject.subscribe(observer));
    Array.from({ length: 2 }, () => subject.complete());
    observers.forEach((observer) => {
      expect(observer.complete).toHaveBeenCalledTimes(1);
    });
    expect(subject.observers).toHaveLength(0);
    expect(subject.thrownError).toBeUndefined();
  });

  it('unsubscribes observers', () => {
    const subject = new Subject();
    const observers = Array.from({ length: 5 }, () => ({
      complete: jest.fn(),
      error: jest.fn(),
      next: jest.fn(),
    }));
    const subscriptions = observers.map((observer) => subject.subscribe(observer));
    subscriptions.slice(3).forEach((subscription) => subscription.unsubscribe());

    subject.next(emittedValues[0]);
    subject.error(errors[1]);
    subject.complete();

    observers.slice(0, 3).forEach((observer) => {
      expect(observer.next).toHaveBeenCalledTimes(1);
      expect(observer.next).toHaveBeenCalledWith(emittedValues[0]);
      expect(observer.error).toHaveBeenCalledTimes(1);
      expect(observer.error).toHaveBeenCalledWith(errors[1]);
      expect(observer.complete).not.toHaveBeenCalled();
    });
    observers.slice(3).forEach((observer) => {
      expect(observer.next).not.toHaveBeenCalled();
      expect(observer.error).not.toHaveBeenCalled();
      expect(observer.complete).not.toHaveBeenCalled();
    });
    expect(subject.observers).toHaveLength(0);
    expect(subject.thrownError).toBe(errors[1]);
  });

  it('unsubscribes', () => {
    const subject = new Subject();
    const observers = Array.from({ length: 5 }, () => ({
      complete: jest.fn(),
      error: jest.fn(),
      next: jest.fn(),
    }));
    observers.map((observer) => subject.subscribe(observer));
    subject.unsubscribe();

    subject.next(emittedValues[0]);
    subject.error(errors[1]);
    subject.complete();

    observers.slice(3).forEach((observer) => {
      expect(observer.next).not.toHaveBeenCalled();
      expect(observer.error).not.toHaveBeenCalled();
      expect(observer.complete).not.toHaveBeenCalled();
    });
    expect(subject.observers).toHaveLength(0);
    expect(subject.thrownError).toBeUndefined();
  });
});
