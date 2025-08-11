import { Stats } from './types.js';
import { Effect, ActiveEffect } from './effects.js';
// import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a participant in combat, which can be a player or a monster.
 * An Actor manages its own stats, health, and active status effects.
 */
let actorIdCounter = 0;

export class Actor {
  public readonly id: string; // Unique instance ID for this combat
  public readonly name: string;
  public level: number;

  private baseStats: Stats;
  public currentStats: Stats;

  private _hp: number;
  public get hp(): number { return this._hp; }

  private activeEffects: ActiveEffect[] = [];

  constructor(name: string | undefined, baseStats: Stats, level: number = 1) {
    this.id = `actor-${actorIdCounter++}`;
    this.name = name || this.id;
    this.level = level;
    this.baseStats = { ...baseStats };
    this._hp = this.baseStats.PV;
    this.currentStats = { ...this.baseStats };
  }

  /**
   * Applies a given amount of damage to the actor, reducing HP.
   * HP cannot go below zero.
   * @param amount The raw amount of damage to apply.
   */
  public takeDamage(amount: number): void {
    this._hp -= Math.round(amount);
    if (this._hp < 0) {
      this._hp = 0;
    }
  }

  /**
   * Heals the actor for a given amount, increasing HP.
   * HP cannot exceed the actor's maximum PV.
   * @param amount The amount of healing to apply.
   */
  public heal(amount: number): void {
    this._hp += Math.round(amount);
    if (this._hp > this.currentStats.PV) {
      this._hp = this.currentStats.PV;
    }
  }

  /**
   * Adds a new status effect to the actor and immediately recalculates stats.
   * @param effect The effect to add.
   */
  public addEffect(effect: Effect): void {
    // For simplicity, we're not handling stacking effects yet.
    // A new effect of the same type would just be added.
    this.activeEffects.push({ effect, remainingDuration: effect.duration });
    this.recalculateStats();
  }

  /**
   * Updates the duration of all active effects, removing any that have expired.
   * This should be called once per game tick or time step.
   * @param deltaTime The time elapsed since the last update, in seconds.
   */
  public updateEffects(deltaTime: number): void {
    let statsChanged = false;
    this.activeEffects = this.activeEffects.filter(activeEffect => {
      activeEffect.remainingDuration -= deltaTime;
      if (activeEffect.remainingDuration <= 0) {
        statsChanged = true; // An effect expired, so stats may change.
        return false; // Remove the effect from the active list.
      }
      return true;
    });

    // If any effect was removed, we need to recalculate the current stats.
    if (statsChanged) {
      this.recalculateStats();
    }
  }

  /**
   * Recalculates the actor's current stats from its base stats and all active effects.
   * This method applies both additive and multiplicative modifiers.
   */
  private recalculateStats(): void {
    // Start with a fresh copy of the base stats.
    const newStats = { ...this.baseStats };

    // Apply additive modifiers first.
    for (const activeEffect of this.activeEffects) {
      if (activeEffect.effect.statModifiers) {
        for (const [stat, value] of Object.entries(activeEffect.effect.statModifiers)) {
          if (typeof value === 'number') {
            (newStats as any)[stat] = ((newStats as any)[stat] || 0) + value;
          }
        }
      }
    }

    // Then apply multiplicative modifiers.
    for (const activeEffect of this.activeEffects) {
      if (activeEffect.effect.statMultipliers) {
        for (const [stat, value] of Object.entries(activeEffect.effect.statMultipliers)) {
          if (typeof value === 'number') {
            (newStats as any)[stat] = Math.round(((newStats as any)[stat] || 0) * value);
          }
        }
      }
    }

    this.currentStats = newStats;

    // Ensure current HP is not greater than the new max HP.
    if (this._hp > this.currentStats.PV) {
        this._hp = this.currentStats.PV;
    }
  }

  /**
   * Checks if the actor is still alive.
   * @returns True if HP is greater than 0.
   */
  public isAlive(): boolean {
    return this._hp > 0;
  }
}
