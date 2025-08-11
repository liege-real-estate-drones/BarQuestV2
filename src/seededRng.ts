/**
 * A simple Linear Congruential Generator (LCG) for deterministic random numbers.
 */
export class SeededRNG {
  private seed: number;

  // LCG parameters (from Numerical Recipes)
  private readonly a = 1664525;
  private readonly c = 1013904223;
  private readonly m = 2 ** 32;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Returns the next pseudo-random integer in the sequence.
   */
  private nextInt(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed;
  }

  /**
   * Returns the next pseudo-random float number between 0 (inclusive) and 1 (exclusive).
   */
  public next(): number {
    return this.nextInt() / this.m;
  }

  /**
   * Returns a pseudo-random integer between min (inclusive) and max (inclusive).
   */
  public roll(min: number, max: number): number {
    const range = max - min + 1;
    const randomValue = Math.floor(this.next() * range);
    return min + randomValue;
  }
}
