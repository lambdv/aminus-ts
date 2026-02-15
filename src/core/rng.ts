/**
 * RNG abstraction for artifact generation and testing
 */

export interface Rng {
  /** Returns a random float in [0, 1) */
  nextFloat(): number;

  /** Returns a random integer in [0, max) */
  nextInt(max: number): number;

  /** Returns a random integer in [min, max) */
  nextIntRange(min: number, max: number): number;

  /** Seeds the RNG for reproducible testing */
  seed?(seed: number): void;
}

/** Default Math.random-based RNG for production use */
export class MathRandomRng implements Rng {
  nextFloat(): number {
    return Math.random();
  }

  nextInt(max: number): number {
    return Math.floor(Math.random() * max);
  }

  nextIntRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}

/** Seeded RNG using simple LCG for deterministic testing */
export class SeededRng implements Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  seed(seed: number): void {
    this.state = seed;
  }

  nextFloat(): number {
    // Simple LCG: state = (state * 1664525 + 1013904223) % 2^32
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return (this.state >>> 0) / 4294967296; // Divide by 2^32 for [0,1)
  }

  nextInt(max: number): number {
    return Math.floor(this.nextFloat() * max);
  }

  nextIntRange(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min)) + min;
  }
}

/** Mock RNG for testing specific sequences */
export class MockRng implements Rng {
  private values: number[];
  private index: number;

  constructor(values: number[]) {
    this.values = values;
    this.index = 0;
  }

  nextFloat(): number {
    const value = this.values[this.index % this.values.length];
    this.index++;
    return value;
  }

  nextInt(max: number): number {
    return Math.floor(this.nextFloat() * max);
  }

  nextIntRange(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min)) + min;
  }
}

/** Global default RNG instance */
export const defaultRng = new MathRandomRng();