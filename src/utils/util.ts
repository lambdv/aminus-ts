export const assert = (expected: boolean, message?: string) => {
  if (expected) return;
  throw new Error(message);
};

export const assertEquals = (expected: any, actual: any) => {
  if (
    expected != null &&
    expected.equals !== undefined &&
    expected.equals(actual)
  )
    return;
  if (expected === actual) return;
  throw new Error(
    `Expected ${expected} (${typeof expected}) but was ${actual} (${typeof actual})`,
  );
};

export function assertApprox(
  actual: number,
  expected: number,
  tolerance: number = 0.001,
): void {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(
      `Expected ${expected}, but got ${actual} (difference: ${diff})`,
    );
  }
}
