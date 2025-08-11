import { describe, it, expect } from 'vitest';
import { scaleMonsterHP, generateMonsterStats, generateBossStats } from './scaling.js';

describe('Stat Scaling Formulas', () => {
  describe('scaleMonsterHP', () => {
    it('should match the HP values from the spec breakpoints table', () => {
      // The user's table seems to have a typo for palier 1.
      // The formula `60 * (1 + 0.1*1)^1.35` correctly yields 68.
      // Let's test the formula's output.
      expect(scaleMonsterHP(1)).toBe(68); // 60 * 1.1^1.35 = 68.19 -> rounded to 68

      // The rest of the values from the table should match.
      expect(scaleMonsterHP(10)).toBe(153); // 152.9 -> 153
      expect(scaleMonsterHP(25)).toBe(326); // 325.6 -> 326
      expect(scaleMonsterHP(50)).toBe(674); // 674.0 -> 674
      expect(scaleMonsterHP(100)).toBe(1528); // 1527.7 -> 1528
    });
  });

  describe('generateMonsterStats', () => {
    it('should generate stats with DPS matching the spec breakpoints table', () => {
      // Palier 1
      const stats1 = generateMonsterStats(1);
      expect(stats1.PV).toBe(68);
      // Target DPS = 68 / 8 = 8.5
      const dps1 = (stats1.AttMin + stats1.AttMax) / 2;
      expect(dps1).toBeCloseTo(8.5, 0);

      // Palier 10
      const stats10 = generateMonsterStats(10);
      expect(stats10.PV).toBe(153);
      // Target DPS = 153 / 8 = 19.125
      const dps10 = (stats10.AttMin + stats10.AttMax) / 2;
      expect(dps10).toBeCloseTo(19.125, 0);

      // Palier 50
      const stats50 = generateMonsterStats(50);
      expect(stats50.PV).toBe(674);
      // Target DPS = 674 / 8 = 84.25
      const dps50 = (stats50.AttMin + stats50.AttMax) / 2;
      expect(dps50).toBeCloseTo(84.25, 0);
    });
  });

  describe('generateBossStats', () => {
    it('should generate boss stats with roughly 3x HP and a 20s TTK', () => {
      const level = 10;
      const bossStats = generateBossStats(level);
      const regularHP = scaleMonsterHP(level);

      // Boss HP should be 3x the regular monster HP for that level
      expect(bossStats.PV).toBe(regularHP * 3);

      // Boss DPS should be based on a 20s TTK
      const bossTargetDPS = bossStats.PV / 20;
      const bossActualDPS = (bossStats.AttMin + bossStats.AttMax) / 2;
      expect(bossActualDPS).toBeCloseTo(bossTargetDPS, 0);
    });
  });
});
