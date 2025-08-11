import { describe, it, expect, vi } from 'vitest';
import { EventBus } from './eventBus.js';

describe('EventBus', () => {
  // Define a type map for the events used in tests.
  type TestEvents = {
    testEvent1: { message: string };
    testEvent2: { value: number };
    noPayloadEvent: undefined;
  };

  it('should allow a listener to subscribe to an event and receive a payload', () => {
    const eventBus = new EventBus<keyof TestEvents, TestEvents>();
    const listener = vi.fn();

    eventBus.subscribe('testEvent1', listener);
    eventBus.publish('testEvent1', { message: 'hello' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ message: 'hello' });
  });

  it('should not call a listener for an event it is not subscribed to', () => {
    const eventBus = new EventBus<keyof TestEvents, TestEvents>();
    const listener = vi.fn();

    eventBus.subscribe('testEvent1', listener);
    eventBus.publish('testEvent2', { value: 123 });

    expect(listener).not.toHaveBeenCalled();
  });

  it('should allow multiple listeners for the same event', () => {
    const eventBus = new EventBus<keyof TestEvents, TestEvents>();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    eventBus.subscribe('testEvent1', listener1);
    eventBus.subscribe('testEvent1', listener2);
    eventBus.publish('testEvent1', { message: 'multiple' });

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener1).toHaveBeenCalledWith({ message: 'multiple' });
    expect(listener2).toHaveBeenCalledWith({ message: 'multiple' });
  });

  it('should allow a listener to be unsubscribed', () => {
    const eventBus = new EventBus<keyof TestEvents, TestEvents>();
    const listener = vi.fn();

    eventBus.subscribe('testEvent1', listener);
    eventBus.publish('testEvent1', { message: 'first call' });

    eventBus.unsubscribe('testEvent1', listener);
    eventBus.publish('testEvent1', { message: 'second call' });

    // The listener should have only been called once.
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should return an unsubscribe function from subscribe() that works correctly', () => {
    const eventBus = new EventBus<keyof TestEvents, TestEvents>();
    const listener = vi.fn();

    const unsubscribe = eventBus.subscribe('testEvent1', listener);
    unsubscribe(); // Unsubscribe immediately.

    eventBus.publish('testEvent1', { message: 'should not be received' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('should handle events with no payload (undefined)', () => {
    const eventBus = new EventBus<keyof TestEvents, TestEvents>();
    const listener = vi.fn();

    eventBus.subscribe('noPayloadEvent', listener);
    eventBus.publish('noPayloadEvent', undefined);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(undefined);
  });

  it('should not fail when publishing an event with no listeners', () => {
    const eventBus = new EventBus<keyof TestEvents, TestEvents>();

    // This should execute without throwing an error.
    expect(() => {
      eventBus.publish('testEvent1', { message: 'no one is listening' });
    }).not.toThrow();
  });
});
