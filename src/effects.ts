import { Stats } from './types.js';

/**
 * Defines the template for a status effect (e.g., a buff or a debuff).
 * These are the static definitions that would be loaded from data files.
 */
export interface Effect {
  id: string;
  name: string;
  duration: number; // Duration in seconds

  /**
   * Additive or subtractive modifiers to the actor's stats.
   * For example, `{ Armure: 50 }` would add 50 armor.
   * `{ Vitesse: -0.1 }` would reduce haste by 10%.
   */
  statModifiers?: Partial<Stats>;

  /**
   * Multiplicative modifiers. Applied after additive ones.
   * For example, `{ PV: 1.1 }` would increase max HP by 10%.
   */
  statMultipliers?: Partial<Stats>;

  // Future extension: Effects that trigger on each tick, like Damage over Time (DoT).
  // tickEffect?: {
  //   type: 'damage' | 'heal';
  //   value: number;
  //   damageType?: 'fire' | 'poison'; // For damage ticks
  // };
}

/**
 * Represents an instance of an Effect that is currently active on an Actor.
 * It tracks the remaining duration of the effect.
 */
export interface ActiveEffect {
  effect: Effect;
  remainingDuration: number;
}
