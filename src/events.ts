import { EventBus } from './eventBus.js';
import { CombatEvent } from './types.js';

/**
 * Defines the mapping between event names and their payload types for the entire game.
 * This provides a centralized, type-safe way to handle all game events.
 */
export type GameEventPayloads = {
  /**
   * Fired for any significant action or state change within a combat.
   * This is the primary event stream for building the combat log.
   */
  combat: CombatEvent;

  // Example of a future event:
  // playerLeveledUp: { newLevel: number; rewards: string[] };
};

/**
 * A single, global instance of the EventBus.
 * Other modules should import this instance to publish or subscribe to game events,
 * ensuring a decoupled communication architecture.
 */
export const gameEventBus = new EventBus<keyof GameEventPayloads, GameEventPayloads>();
