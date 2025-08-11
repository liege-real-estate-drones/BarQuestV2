import { Stats } from './types.js';
import { SeededRNG } from './seededRng.js';

/**
 * This module centralizes all core combat and character calculations for the game,
 * as specified in the project brief.
 */

/**
 * Calculates the Time To Next Hit (TTNH) or action speed.
 * The formula is `BaseDelay / (1 + Haste)`, clamped to a minimum value.
 *
 * @param baseDelay The base time for an action (e.g., 1.6 seconds).
 * @param haste The sum of haste effects (e.g., 0.1 for 10% haste).
 * @returns The calculated time for the next action, in seconds.
 */
export function calculateTTNH(baseDelay: number, haste: number): number {
  // As per spec, TTNH is clamped at a minimum of 0.4 seconds for readability.
  return Math.max(0.4, baseDelay / (1 + haste));
}

/**
 * Calculates the damage dealt after armor mitigation.
 * The formula is `dmg * (1 - Armor / (Armor + k * level))`.
 *
 * @param damage The incoming raw damage amount.
 * @param armor The armor value of the target.
 * @param attackerLevel The level of the attacker, used for scaling the armor effectiveness.
 * @param k A balancing constant (defaults to 50 as per spec).
 * @returns The mitigated damage amount.
 */
export function calculateArmorReduction(damage: number, armor: number, attackerLevel: number, k: number = 50): number {
  if (armor <= 0) {
    return damage;
  }
  // The reduction formula, e.g., if armor = k*level, reduction is 50%.
  const reduction = armor / (armor + k * attackerLevel);
  return damage * (1 - reduction);
}

/**
 * Calculates the chance to hit using a smoothed sigmoid function.
 * This prevents extreme 0% or 100% hit chances and makes precision/dodge stats less spiky.
 * The formula is `1 / (1 + exp(-(Precision - Esquive) / s))`.
 *
 * @param precision The attacker's precision rating.
 * @param esquive The target's dodge rating.
 * @param slope A balancing parameter for the sigmoid curve (defaults to 0.15 as per spec).
 * @returns The probability of hitting, from 0.0 to 1.0.
 */
export function calculateHitChance(precision: number, esquive: number, slope: number = 0.15): number {
    // Avoid division by zero if the slope is configured to be 0.
    if (slope === 0) {
        return precision > esquive ? 1.0 : (precision < esquive ? 0.0 : 0.5);
    }
    const differential = precision - esquive;
    return 1 / (1 + Math.exp(-differential / slope));
}

/**
 * Rolls for damage within a min-max range. A helper for calculateHitDamage.
 *
 * @param rng A seeded random number generator instance for deterministic results.
 * @param minDamage The minimum base damage.
 * @param maxDamage The maximum base damage.
 * @returns A random integer damage value within the specified range.
 */
export function rollDamage(rng: SeededRNG, minDamage: number, maxDamage: number): number {
    if (minDamage >= maxDamage) {
        return Math.floor(minDamage);
    }
    // Use the SeededRNG's roll method to get an integer result.
    return rng.roll(Math.floor(minDamage), Math.floor(maxDamage));
}

/**
 * Calculates the outcome of a single attack, including base damage roll and critical hit check.
 *
 * @param rng An instance of the deterministic RNG to ensure reproducible combat logs.
 * @param attackerStats A subset of the attacker's stats relevant for the calculation.
 * @param skillMultiplier A multiplier from a specific skill (e.g., 1.2 for a 120% damage skill).
 * @returns An object containing the final damage and whether the hit was critical.
 */
export function calculateHitDamage(
    rng: SeededRNG,
    attackerStats: Pick<Stats, 'AttMin' | 'AttMax' | 'CritPct' | 'CritDmg'>,
    skillMultiplier: number = 1.0
): { damage: number; isCrit: boolean } {
    const baseDamage = rollDamage(rng, attackerStats.AttMin, attackerStats.AttMax);

    // Determine if the hit is critical by rolling against the crit chance.
    const isCritRoll = rng.next(); // A random float [0, 1)
    const isCrit = isCritRoll < attackerStats.CritPct;

    let finalDamage = baseDamage;
    if (isCrit) {
        finalDamage *= attackerStats.CritDmg;
    }

    // Apply any skill-specific multipliers.
    finalDamage *= skillMultiplier;

    return { damage: Math.round(finalDamage), isCrit };
}
