import { describe, it, expect, vi, afterEach } from 'vitest';
import { Combat } from './combat.js';
import { Actor } from './actor.js';
import { Stats } from './types.js';
import { gameEventBus, GameEventPayloads } from './events.js';

describe('Combat Engine', () => {
  // Define some standard stats for a player and a monster for testing.
  const playerStats: Stats = {
    PV: 100, Vitesse: 1.0, AttMin: 10, AttMax: 15,
    Precision: 10, Esquive: 1, Armure: 10, CritPct: 0.1, CritDmg: 1.5,
  };
  const monsterStats: Stats = {
    PV: 80, Vitesse: 0.8, AttMin: 5, AttMax: 8,
    Precision: 5, Esquive: 1, Armure: 5, CritPct: 0.05, CritDmg: 1.5,
  };

  // It's good practice to clean up listeners after tests.
  let unsubscribe: (() => void) | null = null;
  afterEach(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  });

  it('should run a combat simulation until one actor is defeated', () => {
    const player = new Actor('Player', playerStats, 1);
    const monster = new Actor('Monster', monsterStats, 1);

    // Use a fixed seed for a predictable fight outcome.
    const combat = new Combat(player, monster, 12345);

    let totalTicks = 0;
    // The tick loop simulates the passage of time until the combat is finished.
    // A max tick count is used to prevent infinite loops in case of a bug.
    while (!combat.isFinished && totalTicks < 1000) {
      combat.tick(0.1); // Advance time by 100ms per tick.
      totalTicks++;
    }

    expect(combat.isFinished).toBe(true);
    // For this specific combat configuration (stats and seed), the player should win.
    expect(player.isAlive()).toBe(true);
    expect(monster.isAlive()).toBe(false);
  });

  it('should emit combat events on the event bus during the fight', () => {
    const player = new Actor('Player', playerStats, 1);
    const monster = new Actor('Monster', monsterStats, 1);
    const combat = new Combat(player, monster, 54321);

    const eventListener = vi.fn();
    unsubscribe = gameEventBus.subscribe('combat', eventListener);

    // Run a few ticks to generate some events.
    for (let i = 0; i < 30; i++) {
      if (combat.isFinished) break;
      combat.tick(0.1);
    }

    // Check that at least one event was fired.
    expect(eventListener).toHaveBeenCalled();

    // Check the structure of the first event.
    const firstEvent = eventListener.mock.calls[0][0] as GameEventPayloads['combat'];
    expect(firstEvent.type).toMatch(/^(hit|miss|crit)$/);
    expect(firstEvent.src).toBeDefined();
    expect(firstEvent.dst).toBeDefined();
    expect(firstEvent.t).toBeGreaterThan(0);
  });

  it('a much stronger monster should defeat the player', () => {
    const player = new Actor('Player', playerStats, 1);
    const bossStats: Stats = { ...monsterStats, PV: 500, AttMin: 20, AttMax: 30 };
    const monster = new Actor('Boss', bossStats, 5);

    const combat = new Combat(player, monster, 999);

    let totalTicks = 0;
    while (!combat.isFinished && totalTicks < 1000) {
      combat.tick(0.1);
      totalTicks++;
    }

    expect(combat.isFinished).toBe(true);
    expect(player.isAlive()).toBe(false);
    expect(monster.isAlive()).toBe(true);
  });
});
