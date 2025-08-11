import { Stats } from './types';

/**
 * This module contains functions for scaling game entities, particularly monsters,
 * based on their level or the dungeon tier ('palier'). The formulas are derived
 * from the project brief's balancing section.
 */

const HP0 = 60; // Base HP
const HP_LEVEL_MULTIPLIER = 0.10;
const HP_LEVEL_EXPONENT = 1.35;
const ELITE_TTK_TARGET = 8; // Target Time-To-Kill in seconds for a standard elite monster
const BOSS_TTK_TARGET = 20; // Target Time-To-Kill in seconds for a boss

/**
 * Calculates monster health for a given level ('palier').
 * Formula from spec: HP0 * (1 + 0.10 * p) ^ 1.35
 *
 * @param level The monster's level or dungeon tier.
 * @returns The calculated maximum health, rounded to the nearest integer.
 */
export function scaleMonsterHP(level: number): number {
  if (level < 1) level = 1;
  // The formula from the spec, where 'p' is the level/palier.
  const hp = HP0 * Math.pow(1 + HP_LEVEL_MULTIPLIER * level, HP_LEVEL_EXPONENT);
  return Math.round(hp);
}

/**
 * Calculates the target average DPS for a monster based on its HP and a target TTK.
 * @param monsterHP The monster's maximum health.
 * @param ttk The target Time-To-Kill for a player against this monster.
 * @returns The target average DPS for the monster.
 */
export function scaleMonsterDPS(monsterHP: number, ttk: number): number {
    return monsterHP / ttk;
}

/**
 * Generates a complete Stats object for a standard monster of a given level.
 * It uses the defined scaling formulas for HP and target DPS, and applies
 * simple linear scaling for other secondary stats.
 *
 * @param level The level of the monster to generate stats for.
 * @returns A complete Stats object.
 */
export function generateMonsterStats(level: number): Stats {
  const hp = scaleMonsterHP(level);
  const targetDPS = scaleMonsterDPS(hp, ELITE_TTK_TARGET);

  // We assume a base attack speed of 1.0 for this calculation.
  // The AttMin/AttMax are set to bracket the target DPS.
  const baseAttackDamage = targetDPS;

  const stats: Stats = {
    PV: hp,
    // Simple linear scaling for other stats. These would need real balancing.
    AttMin: Math.round(baseAttackDamage * 0.85),
    AttMax: Math.round(baseAttackDamage * 1.15),
    Armure: Math.round(5 + level * 2.5), // Grows slowly
    CritPct: 0.05, // Fixed crit chance
    CritDmg: 1.5,  // Fixed crit damage
    Vitesse: 1.0,  // Fixed attack speed for baseline DPS calculation
    Precision: 0.85 + level * 0.005, // Grows very slowly
    Esquive: 0.02 + level * 0.003,   // Grows very slowly
  };

  return stats;
}

/**
 * Generates a complete Stats object for a boss monster of a given level.
 * Bosses have 3x HP and are balanced around a longer TTK.
 *
 * @param level The level of the boss.
 * @returns A complete Stats object for the boss.
 */
export function generateBossStats(level: number): Stats {
    const regularMonsterHP = scaleMonsterHP(level);
    const bossHP = regularMonsterHP * 3;
    const bossTargetDPS = scaleMonsterDPS(bossHP, BOSS_TTK_TARGET);

    const bossStats: Stats = {
        PV: bossHP,
        AttMin: Math.round(bossTargetDPS * 0.85),
        AttMax: Math.round(bossTargetDPS * 1.15),
        Armure: Math.round((5 + level * 2.5) * 1.5), // 50% more armor
        CritPct: 0.10, // Higher crit
        CritDmg: 1.6,
        Vitesse: 1.0,
        Precision: 0.90 + level * 0.005, // Higher base precision
        Esquive: 0.05 + level * 0.003,
    };

    return bossStats;
}
