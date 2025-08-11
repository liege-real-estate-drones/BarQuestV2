import { describe, it, expect } from 'vitest';
import { SeededRNG } from './seededRng.js';

describe('SeededRNG', () => {
  it('should produce a deterministic sequence of numbers for the same seed', () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(42);

    const sequence1 = Array.from({ length: 10 }, () => rng1.next());
    const sequence2 = Array.from({ length: 10 }, () => rng2.next());

    expect(sequence1).toEqual(sequence2);
  });

  it('should produce different sequences for different seeds', () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(1337);

    const sequence1 = Array.from({ length: 10 }, () => rng1.next());
    const sequence2 = Array.from({ length: 10 }, () => rng2.next());

    expect(sequence1).not.toEqual(sequence2);
  });

  it('roll(min, max) should produce a number within the specified range', () => {
    const rng = new SeededRNG(123);
    for (let i = 0; i < 100; i++) {
      const value = rng.roll(5, 10);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(10);
      // Check if the value is an integer
      expect(value).toBe(Math.floor(value));
    }
  });

  it('should produce a repeatable sequence of rolls', () => {
    const rng1 = new SeededRNG(99);
    const rng2 = new SeededRNG(99);

    const rolls1 = Array.from({ length: 10 }, () => rng1.roll(1, 100));
    const rolls2 = Array.from({ length: 10 }, () => rng2.roll(1, 100));

    expect(rolls1).toEqual(rolls2);
    // This is a snapshot of the expected sequence for the given seed and LCG parameters.
    // It ensures the implementation doesn't change accidentally.
    expect(rolls1).toEqual([
        28, 26, 61, 34, 37, 65, 2, 34, 88, 27
    ]);
  });
});
