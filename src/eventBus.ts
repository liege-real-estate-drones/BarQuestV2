// A type-safe, generic event bus for decoupling different parts of the application.

// Defines the shape of a listener function, which takes a payload of a specific type.
type Listener<T> = (payload: T) => void;

/**
 * The EventBus class provides a way to subscribe to events, unsubscribe from them,
 * and publish them.
 *
 * @template E A string literal type for event names.
 * @template P A record mapping event names (E) to their payload types.
 */
export class EventBus<E extends string, P extends Record<E, any>> {
  // Stores listeners, with event names as keys and arrays of listener functions as values.
  private listeners: { [event in E]?: Listener<P[event]>[] } = {};

  /**
   * Subscribes a listener to a specific event.
   *
   * @param event The name of the event to subscribe to.
   * @param listener The callback function to execute when the event is published.
   * @returns A function that, when called, will unsubscribe the listener.
   */
  public subscribe<T extends E>(event: T, listener: Listener<P[T]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener as Listener<P[E]>);

    // Return a function that allows for easy unsubscribing.
    return () => {
      this.unsubscribe(event, listener);
    };
  }

  /**
   * Unsubscribes a listener from a specific event.
   *
   * @param event The name of the event to unsubscribe from.
   * @param listener The specific listener function to remove.
   */
  public unsubscribe<T extends E>(event: T, listener: Listener<P[T]>): void {
    const eventListeners = this.listeners[event];
    if (!eventListeners) {
      return;
    }

    const index = eventListeners.indexOf(listener as Listener<P[E]>);
    if (index > -1) {
      eventListeners.splice(index, 1);
    }
  }

  /**
   * Publishes an event, calling all subscribed listeners with the provided payload.
   *
   * @param event The name of the event to publish.
   * @param payload The data to pass to the listeners.
   */
  public publish<T extends E>(event: T, payload: P[T]): void {
    const eventListeners = this.listeners[event];
    if (!eventListeners) {
      return;
    }

    // Call each listener, wrapped in a try-catch to prevent one failing listener
    // from stopping others.
    eventListeners.forEach(listener => {
      try {
        listener(payload);
      } catch (error) {
        console.error(`Error in event listener for event "${event}":`, error);
      }
    });
  }
}
