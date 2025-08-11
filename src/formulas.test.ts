import { describe, it, expect } from 'vitest';
import {
  calculateTTNH,
  calculateArmorReduction,
  calculateHitChance,
  calculateHitDamage,
  rollDamage,
} from './formulas.js';
import { SeededRNG } from './seededRng.js';
import { Stats } from './types.js';

describe('Combat Formulas', () => {
  describe('calculateTTNH', () => {
    it('should calculate TTNH based on base delay and haste', () => {
      // No haste
      expect(calculateTTNH(1.6, 0)).toBe(1.6);
      // 100% haste should halve the time
      expect(calculateTTNH(1.6, 1)).toBe(0.8);
      // 25% haste
      expect(calculateTTNH(2.0, 0.25)).toBe(1.6);
    });

    it('should clamp TTNH at the minimum value of 0.4s', () => {
      // Exactly 0.4s
      expect(calculateTTNH(1.6, 3)).toBe(0.4);
      // Should not go below 0.4
      expect(calculateTTNH(1.6, 5)).toBe(0.4);
      expect(calculateTTNH(0.3, 0)).toBe(0.4);
    });
  });

  describe('calculateArmorReduction', () => {
    const attackerLevel = 10;
    const k = 50; // As per spec

    it('should reduce incoming damage based on armor value', () => {
      // Armor (500) equals k * level (50 * 10 = 500), so reduction should be 50%
      const reduction = 500 / (500 + k * attackerLevel);
      expect(reduction).toBe(0.5);
      expect(calculateArmorReduction(100, 500, attackerLevel, k)).toBe(50);
    });

    it('should return full damage if armor is zero or negative', () => {
      expect(calculateArmorReduction(100, 0, attackerLevel, k)).toBe(100);
      expect(calculateArmorReduction(100, -50, attackerLevel, k)).toBe(100);
    });

    it('should result in less reduction if armor is lower', () => {
      // Armor (250) is half of k * level (500), so reduction should be 33.3%
      const damage = calculateArmorReduction(100, 250, attackerLevel, k);
      expect(damage).toBeCloseTo(66.67);
    });
  });

  describe('calculateHitChance', () => {
    it('should return ~50% chance for equal precision and esquive', () => {
      expect(calculateHitChance(10, 10)).toBe(0.5);
    });

    it('should return a higher chance for higher precision', () => {
      // Using the formula: 1 / (1 + exp(-(10.15 - 10) / 0.15)) = 1 / (1 + exp(-1))
      expect(calculateHitChance(10.15, 10, 0.15)).toBeCloseTo(0.731);
    });

    it('should return a lower chance for lower precision', () => {
      // Using the formula: 1 / (1 + exp(-(10 - 10.15) / 0.15)) = 1 / (1 + exp(1))
      expect(calculateHitChance(10, 10.15, 0.15)).toBeCloseTo(0.269);
    });
  });

  describe('calculateHitDamage', () => {
    const rng = new SeededRNG(42); // A fixed seed for deterministic tests
    const stats: Pick<Stats, 'AttMin' | 'AttMax' | 'CritPct' | 'CritDmg'> = {
      AttMin: 100,
      AttMax: 200,
      CritPct: 0.2, // 20% crit chance
      CritDmg: 1.5, // 150% crit damage
    };

    it('should calculate a non-critical hit correctly', () => {
      const nonCritRng = new SeededRNG(1); // This seed's first roll is > 0.2
      const result = calculateHitDamage(nonCritRng, stats);

      expect(result.isCrit).toBe(false);
      // Damage should be in the base range
      expect(result.damage).toBeGreaterThanOrEqual(100);
      expect(result.damage).toBeLessThanOrEqual(200);
    });

    it('should calculate a critical hit correctly', () => {
      const critRng = new SeededRNG(42); // This seed's first roll is < 0.2
      const result = calculateHitDamage(critRng, stats);

      expect(result.isCrit).toBe(true);
      // Damage should be in the crit range (base * 1.5)
      expect(result.damage).toBeGreaterThanOrEqual(100 * 1.5);
      expect(result.damage).toBeLessThanOrEqual(200 * 1.5);
    });

    it('should apply skill multiplier correctly', () => {
        const nonCritRng = new SeededRNG(1);
        const result = calculateHitDamage(nonCritRng, stats, 2.0); // 200% damage skill

        expect(result.isCrit).toBe(false);
        // Damage should be in the multiplied base range
        expect(result.damage).toBeGreaterThanOrEqual(100 * 2.0);
        expect(result.damage).toBeLessThanOrEqual(200 * 2.0);
    });
  });

  describe('rollDamage', () => {
    it('should return a value within the specified integer range', () => {
      const rng = new SeededRNG(123);
      for (let i = 0; i < 100; i++) {
        const damage = rollDamage(rng, 10, 20);
        expect(damage).toBeGreaterThanOrEqual(10);
        expect(damage).toBeLessThanOrEqual(20);
        expect(damage).toBe(Math.floor(damage));
      }
    });
  });
});
