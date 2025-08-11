import { describe, it, expect } from 'vitest';
import { Actor } from './actor';
import { Stats } from './types';
import { Effect } from './effects';

describe('Actor', () => {
  const baseStats: Stats = {
    PV: 100,
    AttMin: 10,
    AttMax: 10,
    Armure: 20,
    CritPct: 0.1,
    CritDmg: 1.5,
    Vitesse: 1.0,
    Precision: 0.9,
    Esquive: 0.1,
  };

  it('should initialize with base stats, full HP, and a unique ID', () => {
    const actor = new Actor('Hero', baseStats);
    expect(actor.id).toBeDefined();
    expect(typeof actor.id).toBe('string');
    expect(actor.name).toBe('Hero');
    expect(actor.hp).toBe(100);
    expect(actor.currentStats).toEqual(baseStats);
    expect(actor.isAlive()).toBe(true);
  });

  it('should take damage correctly', () => {
    const actor = new Actor('Hero', baseStats);
    actor.takeDamage(30);
    expect(actor.hp).toBe(70);
  });

  it('should not have HP below zero and should be marked as not alive', () => {
    const actor = new Actor('Hero', baseStats);
    actor.takeDamage(120);
    expect(actor.hp).toBe(0);
    expect(actor.isAlive()).toBe(false);
  });

  it('should heal correctly', () => {
    const actor = new Actor('Hero', baseStats);
    actor.takeDamage(50);
    expect(actor.hp).toBe(50);
    actor.heal(20);
    expect(actor.hp).toBe(70);
  });

  it('should not heal above max HP', () => {
    const actor = new Actor('Hero', baseStats);
    actor.takeDamage(10);
    expect(actor.hp).toBe(90);
    actor.heal(50);
    expect(actor.hp).toBe(100);
  });

  it('should add an effect and recalculate stats with additive modifiers', () => {
    const actor = new Actor('Hero', baseStats);
    const armorBuff: Effect = {
      id: 'armor_buff',
      name: 'Stoneskin',
      duration: 10,
      statModifiers: { Armure: 50 },
    };
    actor.addEffect(armorBuff);
    expect(actor.currentStats.Armure).toBe(70); // 20 base + 50 buff
  });

  it('should apply multiplicative and additive effects correctly', () => {
    const actor = new Actor('Hero', baseStats);
    const armorBuff: Effect = {
      id: 'armor_buff', name: 'Stoneskin', duration: 10,
      statModifiers: { Armure: 50 }, // Add 50
    };
    const armorMultiplier: Effect = {
        id: 'armor_mult', name: 'Aura of Protection', duration: 10,
        statMultipliers: { Armure: 1.2 }, // Multiply by 1.2
    };
    actor.addEffect(armorBuff);
    actor.addEffect(armorMultiplier);
    // Base(20) + Additive(50) = 70.
    // 70 * Multiplicative(1.2) = 84.
    expect(actor.currentStats.Armure).toBe(84);
  });

  it('should remove an effect after its duration expires and revert stats', () => {
    const actor = new Actor('Hero', baseStats);
    const armorBuff: Effect = {
      id: 'armor_buff',
      name: 'Stoneskin',
      duration: 5,
      statModifiers: { Armure: 50 },
    };
    actor.addEffect(armorBuff);
    expect(actor.currentStats.Armure).toBe(70);

    actor.updateEffects(3); // Update, but not enough to expire.
    expect(actor.currentStats.Armure).toBe(70);

    actor.updateEffects(3); // Update again, effect's total elapsed time is 6s, so it should expire.
    expect(actor.currentStats.Armure).toBe(20); // Back to base stats.
  });

  it('should cap HP if max HP is reduced by an effect', () => {
    const actor = new Actor('Hero', baseStats);
    const hpDebuff: Effect = {
        id: 'hp_debuff',
        name: 'Curse of Frailty',
        duration: 10,
        statModifiers: { PV: -20 } // Reduces max HP
    };
    actor.addEffect(hpDebuff);
    expect(actor.currentStats.PV).toBe(80);
    // Since the actor was at full health, their current HP should be capped at the new max.
    expect(actor.hp).toBe(80);
  });
});
