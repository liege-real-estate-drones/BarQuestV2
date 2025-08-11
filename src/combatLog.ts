import { gameEventBus } from './events';
import { CombatEvent } from './types';

/**
 * A logger class that subscribes to the global game event bus to record
 * combat events. This provides a chronological log of a combat encounter,
 * which can be used for display in a UI, for simulations, or for debugging.
 */
export class CombatLog {
  private events: CombatEvent[] = [];
  private unsubscribe: (() => void) | null = null;

  /**
   * When a CombatLog is instantiated, it automatically starts listening
   * for combat events.
   */
  constructor() {
    this.listen();
  }

  /**
   * Subscribes to the 'combat' channel on the global event bus.
   * This method is idempotent; calling it multiple times has no effect.
   */
  public listen(): void {
    if (this.unsubscribe) {
      // Already subscribed, do nothing.
      return;
    }
    // The handleEvent method is bound to `this` to ensure it has the correct
    // context when called by the event bus.
    this.unsubscribe = gameEventBus.subscribe('combat', this.handleEvent);
  }

  /**
   * Unsubscribes from the event bus. This is important for cleanup to prevent
   * memory leaks if the CombatLog instance is no longer needed.
   */
  public stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * The callback function that receives events from the event bus.
   */
  private handleEvent = (event: CombatEvent): void => {
    this.events.push(event);
  }

  /**
   * Retrieves all the events recorded by this logger.
   * @returns A copy of the internal events array to prevent external modification.
   */
  public getEvents(): CombatEvent[] {
    return [...this.events];
  }

  /**
   * Clears all events from the log, useful for resetting between combats.
   */
  public clear(): void {
    this.events = [];
  }
}
