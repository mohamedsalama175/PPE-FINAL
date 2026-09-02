export class AssertionError extends Error {
  constructor(message: string, public actual?: any, public expected?: any) {
    super(message);
    this.name = "AssertionError";
  }
}

let totalAssertions = 0;

export function getAssertionCount(): number {
  return totalAssertions;
}

export function resetAssertionCount(): void {
  totalAssertions = 0;
}

export function expect(actual: any) {
  return {
    toBe(expected: any, message?: string) {
      totalAssertions++;
      if (actual !== expected) {
        throw new AssertionError(
          message || `Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`,
          actual,
          expected
        );
      }
    },
    toEqual(expected: any, message?: string) {
      totalAssertions++;
      const actualJson = JSON.stringify(actual);
      const expectedJson = JSON.stringify(expected);
      if (actualJson !== expectedJson) {
        throw new AssertionError(
          message || `Expected ${actualJson} to equal ${expectedJson}`,
          actual,
          expected
        );
      }
    },
    toBeGreaterThan(expected: number, message?: string) {
      totalAssertions++;
      if (typeof actual !== "number" || actual <= expected) {
        throw new AssertionError(
          message || `Expected ${actual} to be greater than ${expected}`,
          actual,
          expected
        );
      }
    },
    toBeGreaterThanOrEqual(expected: number, message?: string) {
      totalAssertions++;
      if (typeof actual !== "number" || actual < expected) {
        throw new AssertionError(
          message || `Expected ${actual} to be >= ${expected}`,
          actual,
          expected
        );
      }
    },
    toBeLessThan(expected: number, message?: string) {
      totalAssertions++;
      if (typeof actual !== "number" || actual >= expected) {
        throw new AssertionError(
          message || `Expected ${actual} to be < ${expected}`,
          actual,
          expected
        );
      }
    },
    toBeLessThanOrEqual(expected: number, message?: string) {
      totalAssertions++;
      if (typeof actual !== "number" || actual > expected) {
        throw new AssertionError(
          message || `Expected ${actual} to be <= ${expected}`,
          actual,
          expected
        );
      }
    },
    toBeDefined(message?: string) {
      totalAssertions++;
      if (actual === undefined) {
        throw new AssertionError(message || `Expected value to be defined, got undefined`, actual, "defined");
      }
    },
    toBeUndefined(message?: string) {
      totalAssertions++;
      if (actual !== undefined) {
        throw new AssertionError(message || `Expected value to be undefined, got ${JSON.stringify(actual)}`, actual, undefined);
      }
    },
    toBeNull(message?: string) {
      totalAssertions++;
      if (actual !== null) {
        throw new AssertionError(message || `Expected value to be null, got ${JSON.stringify(actual)}`, actual, null);
      }
    },
    toBeTruthy(message?: string) {
      totalAssertions++;
      if (!actual) {
        throw new AssertionError(message || `Expected ${JSON.stringify(actual)} to be truthy`, actual, true);
      }
    },
    toBeFalsy(message?: string) {
      totalAssertions++;
      if (actual) {
        throw new AssertionError(message || `Expected ${JSON.stringify(actual)} to be falsy`, actual, false);
      }
    },
    toContain(item: any, message?: string) {
      totalAssertions++;
      if (Array.isArray(actual)) {
        if (!actual.includes(item)) {
          throw new AssertionError(
            message || `Expected array to contain ${JSON.stringify(item)}`,
            actual,
            item
          );
        }
      } else if (typeof actual === "string") {
        if (!actual.includes(String(item))) {
          throw new AssertionError(
            message || `Expected string to contain "${item}"`,
            actual,
            item
          );
        }
      } else {
        throw new AssertionError(message || `Expected array or string, got ${typeof actual}`, actual, item);
      }
    },
  };
}

export function assertStatus(res: { status: number; data?: any }, expectedStatus: number, message?: string): void {
  totalAssertions++;
  if (res.status !== expectedStatus) {
    const errDetails = res.data?.error || JSON.stringify(res.data);
    throw new AssertionError(
      message || `Expected HTTP status ${expectedStatus}, but received ${res.status}. Response body: ${errDetails}`,
      res.status,
      expectedStatus
    );
  }
}

export function assertSuccess(res: { status: number; data?: any }, message?: string): void {
  totalAssertions++;
  if (res.status < 200 || res.status >= 300) {
    const errDetails = res.data?.error || JSON.stringify(res.data);
    throw new AssertionError(
      message || `Expected successful HTTP status (2xx), but received ${res.status}. Response: ${errDetails}`,
      res.status,
      "2xx"
    );
  }
}

export function assertError(res: { status: number; data?: any }, expectedStatus?: number, message?: string): void {
  totalAssertions++;
  if (expectedStatus) {
    if (res.status !== expectedStatus) {
      throw new AssertionError(
        message || `Expected error status ${expectedStatus}, but got ${res.status}`,
        res.status,
        expectedStatus
      );
    }
  } else {
    if (res.status < 400) {
      throw new AssertionError(
        message || `Expected error status (>=400), but got ${res.status}`,
        res.status,
        ">=400"
      );
    }
  }
}
